import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
	ACCESS_TOKEN,
	ACCESS_TOKEN_EXPIRY,
	REFRESH_TOKEN,
	REFRESH_TOKEN_EXPIRY,
} from '@/data/constants';
export async function POST(request: NextRequest) {
	const body = await request.json();
	const { refreshToken } = body;
	const cookieStore = await cookies();

	try {
		const url = `${process.env.API_URL}/api/auth/refreshToken`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				refreshToken,
			}),
		});

		const data = await res.json();
		const {
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			message,
		} = data || {};

		if (newAccessToken && newRefreshToken) {
			let response = NextResponse.next();
			cookieStore.set(ACCESS_TOKEN, newAccessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: ACCESS_TOKEN_EXPIRY,
				path: '/',
			});

			cookieStore.set(REFRESH_TOKEN, newRefreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: REFRESH_TOKEN_EXPIRY,
				path: '/',
			});

			return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });
		}

		return NextResponse.json({
			status: 'ERROR',
			message: message,
		});
	} catch (error) {
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong, pleas try again later',
			error,
		});
	}
}
