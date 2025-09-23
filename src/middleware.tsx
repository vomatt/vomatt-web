import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getUserSession } from '@/lib/auth';
import { LanguageCode } from '@/types';

import { i18n, SUPPORTED_LANGUAGES } from './i18n-config';

let redirectToLogin = false;
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

export async function middleware(request: NextRequest) {
	const userSession = await getUserSession();

	if (
		(!userSession || redirectToLogin) &&
		(request.nextUrl.pathname.startsWith('/login') ||
			request.nextUrl.pathname.startsWith('/signup'))
	) {
		return;
	}

	if (
		!userSession &&
		(request.nextUrl.pathname.startsWith('/api/user') ||
			request.nextUrl.pathname.startsWith('/api/auth/logout'))
	) {
		return NextResponse.json(
			{
				error: 'You are not logged in. Please provide a token to gain access.',
			},
			{ status: 401 }
		);
	}
	const response = NextResponse.next();

	// try {
	// 	if (userSession) {
	// 		const { userId } = userSession;

	// 		response.headers.set('X-USER-ID', userId);
	// 		request.user = { id: userId };
	// 	}
	// } catch (error) {
	// 	redirectToLogin = true;
	// 	if (request.nextUrl.pathname.startsWith('/api')) {
	// 		return NextResponse.json(
	// 			{
	// 				error: "Token is invalid or user doesn't exists",
	// 			},
	// 			{ status: 401 }
	// 		);
	// 	}

	// 	return NextResponse.redirect(
	// 		new URL(
	// 			`/login?${new URLSearchParams({ error: 'bad-auth' })}`,
	// 			request.url
	// 		)
	// 	);
	// }

	// const authUser = request.user;

	// if (!authUser) {
	// 	return NextResponse.redirect(
	// 		new URL(
	// 			`/login?${new URLSearchParams({
	// 				error: 'bad-auth',
	// 				forceLogin: 'true',
	// 			})}`,
	// 			request.url
	// 		)
	// 	);
	// }

	// if (
	// 	authUser &&
	// 	(request.url.includes('/login') || request.url.includes('/register'))
	// ) {
	// 	return NextResponse.redirect(new URL('/account/settings', request.url));
	// }

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
