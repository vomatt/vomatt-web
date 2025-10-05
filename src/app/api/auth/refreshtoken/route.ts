import { NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '@/data/constants';
export async function POST(request: NextRequest, response: NextResponse) {
	const body = await request.json();
	const { refreshToken } = body;

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
		console.log('🚀 ~ :20 ~ POST ~ data:', data);
		const {
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			message,
		} = data || {};

		if (newAccessToken && newRefreshToken) {
			response.cookies.set('accessToken', newAccessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: ACCESS_TOKEN_EXPIRY,
				path: '/',
			});

			response.cookies.set('refreshToken', newRefreshToken, {
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
