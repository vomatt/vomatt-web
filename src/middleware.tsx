import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { decrypt, getUserSession } from '@/lib/auth';

import { i18n } from './i18n-config';

let redirectToLogin = false;

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

	return locale;
}

export async function middleware(request: NextRequest) {
	const cookieStore = await cookies();
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
	const cookieLanguage = request.cookies.get('preferred-language')?.value;

	if (!cookieLanguage) {
		const locale = getLocale(request);
		cookieStore.set('preferred-language', locale || i18n.defaultLocale);
	}

	return response;
}
export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
