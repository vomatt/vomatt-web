import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/data/constants';
import {
	buildAuthCookies,
	isExpiringSoon,
	requestTokenRefresh,
	verifyAccessToken,
} from '@/lib/api/tokens';
import { getSafeRedirectPath } from '@/lib/routes';
import { AuthTokens, LanguageCode } from '@/types';

import { i18n, SUPPORTED_LANGUAGES } from './i18n-config';

function parseAcceptLanguage(acceptLanguage: string): LanguageCode[] {
	return acceptLanguage
		.split(',')
		.map((lang) => {
			const [code, quality = 'q=1'] = lang.trim().split(';');
			const q = parseFloat(quality.replace('q=', ''));
			return { code: code.split('-')[0] as LanguageCode, quality: q };
		})
		.sort((a, b) => b.quality - a.quality)
		.map((lang) => lang.code)
		.filter((code) => Object.keys(SUPPORTED_LANGUAGES).includes(code));
}

function detectLanguageFromHeaders(request: NextRequest): LanguageCode {
	const acceptLanguage = request.headers.get('accept-language');

	if (!acceptLanguage) return i18n.defaultLocale;

	const preferredLanguages = parseAcceptLanguage(acceptLanguage);
	return preferredLanguages[0] || i18n.defaultLocale;
}

function getLocale(request: NextRequest): string | undefined {
	// Negotiator expects plain object so we need to transform headers
	const negotiatorHeaders: Record<string, string> = {};
	request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

	// @ts-ignore locales are readonly
	const locales: string[] = i18n.locales;

	// Use negotiator and intl-localematcher to get best locale
	let languages = new Negotiator({ headers: negotiatorHeaders }).languages(
		locales
	);

	const locale = matchLocale(languages, locales, i18n.defaultLocale);

	return locale || i18n.defaultLocale;
}

const protectedPaths = ['/account', '/my-polls', '/notifications'];
const authPaths = ['/login', '/signup'];

type SessionResult =
	| { status: 'valid' }
	| { status: 'refreshed'; tokens: AuthTokens }
	| { status: 'misconfigured'; tokens: AuthTokens }
	| { status: 'none' }
	| { status: 'dead' };

/**
 * Set when a freshly issued access token still fails verification, i.e.
 * SESSION_SECRET doesn't match the API's JWT_SECRET. Holds the refresh token
 * it was learned with, so that pair isn't rotated again on every request.
 */
const KEY_MISMATCH = 'auth-key-mismatch';

/**
 * Valid access token → valid. Missing, invalid or nearly expired → one
 * refresh attempt. A refresh token the backend refuses is dead and gets
 * cleared, so later requests don't retry it. When the backend can't be
 * reached the cookies stay, and the next request tries again.
 */
async function resolveSession(request: NextRequest): Promise<SessionResult> {
	const accessToken = request.cookies.get(ACCESS_TOKEN)?.value;
	const refreshToken = request.cookies.get(REFRESH_TOKEN)?.value;

	const payload = accessToken ? await verifyAccessToken(accessToken) : null;
	if (payload && (!refreshToken || !isExpiringSoon(payload))) return { status: 'valid' };
	if (!refreshToken) return { status: 'none' };
	// Already known not to verify; refreshing again would only rotate in a loop
	if (request.cookies.get(KEY_MISMATCH)?.value === refreshToken) return { status: 'none' };

	const result = await requestTokenRefresh(refreshToken);
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
	return result.status === 'rejected' ? { status: 'dead' } : { status: 'none' };
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isUnder = (paths: string[]) =>
		paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
	const isProtectedPath = isUnder(protectedPaths);
	const isAuthPath = isUnder(authPaths);

	const session = await resolveSession(request);
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

	const applyAuthCookies = (res: NextResponse) => {
		for (const { name, value, options } of authCookies) res.cookies.set(name, value, options);
		if (session.status === 'dead') {
			res.cookies.delete(ACCESS_TOKEN);
			res.cookies.delete(REFRESH_TOKEN);
		}
		if (session.status === 'misconfigured') {
			res.cookies.set(KEY_MISMATCH, session.tokens.refreshToken, { httpOnly: true, path: '/' });
		}
		return res;
	};

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
		if (session.status === 'dead') loginUrl.searchParams.set('session_expired', '1');
		return applyAuthCookies(NextResponse.redirect(loginUrl));
	}

	const response = applyAuthCookies(
		NextResponse.next({ request: { headers: request.headers } })
	);

	// Check for language preference in cookie (if you want to set one)
	const savedLanguage = request.cookies.get('preferred-language')?.value;

	if (!savedLanguage) {
		const locale = getLocale(request) || i18n.defaultLocale;
		response.cookies.set('preferred-language', locale, {
			maxAge: 365 * 24 * 60 * 60, // 1 year
			httpOnly: false, // Allow client-side JavaScript access
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/', // Available on all paths
		});

		// Add header for initial server-side rendering
		response.headers.set('x-detected-language', locale);
	}

	// Add current language to headers for server components
	const currentLanguage =
		savedLanguage && Object.keys(SUPPORTED_LANGUAGES).includes(savedLanguage)
			? savedLanguage
			: detectLanguageFromHeaders(request);

	response.headers.set('x-current-language', currentLanguage);

	return response;
}
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
