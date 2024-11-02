import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { decrypt } from '@/lib/auth';

export async function POST(request: NextRequest) {
	const body = await request.json();
	const { email, verifyCode } = body;
	const cookieStore = await cookies();

	try {
		const url = `${process.env.API_URL}/auth/login`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				verifyCode,
			}),
		});

		const data = await res.json();
		console.log('🚀 ~ file: route.ts:25 ~ POST ~ data:', data);
		const { status, statusCode, message, accessToken, refreshToken } =
			data || {};

		if (status === 'SUCCESS' && accessToken && refreshToken) {
			const decryptToken = await decrypt(accessToken);
			const { exp } = decryptToken;
			const userSession = {
				accessToken,
				refreshToken,
			};

			const expires = new Date(exp * 1000);
			cookieStore.set('USER_SESSION', JSON.stringify(userSession), {
				expires,
				httpOnly: true,
			});

			return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });
		}

		return NextResponse.json({
			status: 'ERROR',
			message: 'Wrong code',
			statusCode,
		});
	} catch (error) {
		console.log('🚀 ~ file: route.ts:34 ~ POST ~ error:', error);
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong',
			error,
		});
	}
}
