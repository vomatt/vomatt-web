import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { decrypt, getUserSession } from '@/lib/auth';
let redirectToLogin = false;

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

	return response;
}
export const config = {
	matcher: [
		'/account/:path*',
		'/login',
		'/signup',
		'/api/user/:path*',
		'/api/auth/logout',
	],
};
