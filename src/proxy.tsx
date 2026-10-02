import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/data/constants';
import {
	buildAuthCookies,
	requestTokenRefresh,
	verifyAccessToken,
} from '@/lib/api/tokens';
import { LanguageCode } from '@/types';

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
const authPaths = ['/login', '/register'];

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtectedPath = protectedPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`)
	);
	const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
	const response = NextResponse.next();

	const accessToken = request.cookies.get(ACCESS_TOKEN)?.value;
	const refreshToken = request.cookies.get(REFRESH_TOKEN)?.value;

	let hasValidSession =
		!!accessToken && (await verifyAccessToken(accessToken)) !== null;

	// If access token is invalid/missing but refresh token exists, try to refresh
	// proactively so server components see a fresh access token immediately.
	if (!hasValidSession && refreshToken) {
		const newTokens = await requestTokenRefresh(refreshToken);
		if (newTokens) {
			hasValidSession = true;
			for (const { name, value, options } of buildAuthCookies(newTokens)) {
				response.cookies.set(name, value, options);
			}
		}
	}

	// Redirect authenticated users away from auth pages
	if (hasValidSession && isAuthPath) {
		const redirect = NextResponse.redirect(new URL('/', request.url));
		// Keep any tokens refreshed above; the backend may have rotated them.
		response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
		return redirect;
	}

	// Redirect unauthenticated users to login
	if (!hasValidSession && isProtectedPath) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

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
