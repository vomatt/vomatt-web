import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
	ACCESS_TOKEN,
	REFRESH_TOKEN,
	SESSION_PROBE_HEADER,
	SESSION_UNCONFIRMED,
	SESSION_UNCONFIRMED_HEADER,
} from '@/data/constants';
import { SIGNED_IN_FEED_ROOTS } from '@/features/polls/feeds';
import { clientHeaders } from '@/lib/api/client-ip';
import {
	AUTH_COOKIE_BASE,
	buildAuthCookies,
	isExpiringSoon,
	isSessionRevoked,
	requestTokenRefresh,
	tokenFingerprint,
	verifyAccessToken,
} from '@/lib/api/tokens';
import { getSafeRedirectPath } from '@/lib/routes';
import { AuthTokens } from '@/types';

import { i18n, type Locale } from './i18n-config';

/** The first supported language in Accept-Language, by q-value; a regional tag (zh-TW) matches its language. */
function getLocale(request: NextRequest): Locale {
	const ranked = (request.headers.get('accept-language') ?? '')
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().toLowerCase().split(';');
			const q = params.find((param) => param.trim().startsWith('q='));
			return { tag, q: q ? Number(q.trim().slice(2)) : 1 };
		})
		.filter(({ q }) => q > 0)
		.sort((a, b) => b.q - a.q);
	for (const { tag } of ranked) {
		const locale = i18n.locales.find((supported) => tag === supported || tag.startsWith(`${supported}-`));
		if (locale) return locale;
	}
	return i18n.defaultLocale;
}

const protectedPaths = ['/account', '/notifications', '/settings', ...SIGNED_IN_FEED_ROOTS.map((root) => `/${root}`)];
const authPaths = ['/login'];

type SessionResult =
	| { status: 'valid' }
	| { status: 'refreshed'; tokens: AuthTokens }
	| { status: 'misconfigured'; tokens: AuthTokens }
	| { status: 'none' }
	| { status: 'unreachable' }
	| { status: 'dead'; suspicious?: true };

/**
 * Set when a freshly issued access token still fails verification, i.e.
 * SESSION_SECRET doesn't match the API's JWT_SECRET. Holds the fingerprint of
 * the refresh token it was learned with (never the token itself), so that pair
 * isn't rotated again on every request.
 */
const KEY_MISMATCH = 'auth-key-mismatch';

/**
 * Valid access token → valid. Missing, invalid or nearly expired → one
 * refresh attempt. A refresh token the backend refuses is dead and gets
 * cleared, so later requests don't retry it. When the backend can't be
 * reached the cookies stay, the page shows it is still signing in, and the
 * next request tries again.
 */
async function resolveSession(request: NextRequest): Promise<SessionResult> {
	const accessToken = request.cookies.get(ACCESS_TOKEN)?.value;
	const refreshToken = request.cookies.get(REFRESH_TOKEN)?.value;

	const payload = accessToken ? await verifyAccessToken(accessToken) : null;
	if (payload && (!refreshToken || !isExpiringSoon(payload))) return { status: 'valid' };
	if (!refreshToken) return { status: 'none' };
	// Already known not to verify; refreshing again would only rotate in a loop
	const mismatch = request.cookies.get(KEY_MISMATCH)?.value;
	if (mismatch && mismatch === (await tokenFingerprint(refreshToken))) return { status: 'none' };

	const result = await requestTokenRefresh(refreshToken, clientHeaders(request.headers));
	if (result.status === 'ok') {
		// A token the API just issued that still fails here can't be fixed by refreshing
		if (await verifyAccessToken(result.tokens.accessToken)) {
			return { status: 'refreshed', tokens: result.tokens };
		}
		console.error('Access token failed verification: check SESSION_SECRET matches the API JWT_SECRET');
		return { status: 'misconfigured', tokens: result.tokens };
	}
	// Keep a still-valid access token for its last seconds rather than signing out early
	if (payload) return { status: 'valid' };
	if (result.status === 'unavailable') return { status: 'unreachable' };
	return result.suspicious ? { status: 'dead', suspicious: true } : { status: 'dead' };
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isUnder = (paths: string[]) =>
		paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
	const isProtectedPath = isUnder(protectedPaths);
	const isAuthPath = isUnder(authPaths);

	const resolved = await resolveSession(request);
	// A token signed out from another device still verifies, so a page load of login asks the API before sending
	// the visitor away, and clears a session it says is over. Not on a Server Action: the sign-in action sets the
	// new session's cookies on the same response.
	const session: SessionResult =
		resolved.status === 'valid' &&
		isAuthPath &&
		request.method === 'GET' &&
		(await isSessionRevoked(request.cookies.get(ACCESS_TOKEN)!.value, clientHeaders(request.headers)))
			? { status: 'dead' }
			: resolved;
	const hasValidSession = session.status === 'valid' || session.status === 'refreshed';

	// Server Components and Server Actions read cookies from the request, so
	// rotated tokens must be written there too, not only to the browser.
	// A misconfigured rotation is still saved: the old refresh token is spent.
	const authCookies =
		session.status === 'refreshed' || session.status === 'misconfigured'
			? buildAuthCookies(session.tokens)
			: [];
	if (session.status === 'dead') {
		request.cookies.delete(ACCESS_TOKEN);
		request.cookies.delete(REFRESH_TOKEN);
	}
	for (const { name, value } of authCookies) request.cookies.set(name, value);

	const mismatchMark =
		session.status === 'misconfigured' ? await tokenFingerprint(session.tokens.refreshToken) : null;
	const applyAuthCookies = (res: NextResponse) => {
		for (const { name, value, options } of authCookies) res.cookies.set(name, value, options);
		if (session.status === 'dead') {
			res.cookies.delete(ACCESS_TOKEN);
			res.cookies.delete(REFRESH_TOKEN);
		}
		if (mismatchMark) res.cookies.set(KEY_MISMATCH, mismatchMark, AUTH_COOKIE_BASE);
		// Readable by the page: a client navigation can't show SessionRetry, so it reloads instead
		if (session.status === 'unreachable') {
			res.cookies.set(SESSION_UNCONFIRMED, '1', { ...AUTH_COOKIE_BASE, httpOnly: false });
		} else if (request.cookies.has(SESSION_UNCONFIRMED)) {
			res.cookies.delete(SESSION_UNCONFIRMED);
		}
		return res;
	};

	// SessionRetry asks whether the session can be settled yet, without a render
	if (request.headers.has(SESSION_PROBE_HEADER)) {
		const status = session.status === 'unreachable' ? 503 : 204;
		return applyAuthCookies(new NextResponse(null, { status }));
	}

	// Redirect authenticated users away from auth pages, unless the API rejected
	// their session and they were sent to sign in again
	if (hasValidSession && isAuthPath && !request.nextUrl.searchParams.has('session_expired')) {
		const target = getSafeRedirectPath(request.nextUrl.searchParams.get('redirect'));
		return applyAuthCookies(NextResponse.redirect(new URL(target, request.url)));
	}

	// Redirect unauthenticated users to login
	if (!hasValidSession && isProtectedPath) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
		// `security`: the API signed this session out after seeing a reused token
		if (session.status === 'dead') {
			loginUrl.searchParams.set('session_expired', session.suspicious ? 'security' : '1');
		}
		return applyAuthCookies(NextResponse.redirect(loginUrl));
	}

	// The root layout renders SessionRetry in place of the page
	const requestHeaders = new Headers(request.headers);
	requestHeaders.delete(SESSION_UNCONFIRMED_HEADER);
	if (session.status === 'unreachable') requestHeaders.set(SESSION_UNCONFIRMED_HEADER, '1');

	const response = applyAuthCookies(
		NextResponse.next({ request: { headers: requestHeaders } })
	);

	// Check for language preference in cookie (if you want to set one)
	const savedLanguage = request.cookies.get('preferred-language')?.value;

	if (!savedLanguage) {
		const locale = getLocale(request);
		response.cookies.set('preferred-language', locale, {
			maxAge: 365 * 24 * 60 * 60, // 1 year
			httpOnly: false, // Allow client-side JavaScript access
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/', // Available on all paths
		});
	}

	return response;
}
export const config = {
	// Static avatars skip it: each image would otherwise run a token refresh.
	// .well-known files are fetched by Apple's CDN and need no cookies or language.
	matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|avatars/|\\.well-known/).*)'],
};
