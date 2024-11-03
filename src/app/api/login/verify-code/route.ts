import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { REFRESH_TOKEN, USER_SESSION } from '@/data/constants';
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
		const { status, statusCode, accessToken, refreshToken } = data || {};

		if (status === 'SUCCESS' && accessToken) {
			const decryptToken = await decrypt(accessToken);
			const { exp } = decryptToken;
			const expires = new Date(exp * 1000);
			cookieStore.set(USER_SESSION, accessToken, {
				expires,
				httpOnly: true,
			});

			cookieStore.set(REFRESH_TOKEN, refreshToken, {
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
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong',
			error,
		});
	}
}
