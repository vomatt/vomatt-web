import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/data/constants';
import { decodeToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
	const body = await request.json();
	const cookieStore = await cookies();
	const { email, firstName, lastName, username, verificationCode } = body;

	try {
		const url = `${process.env.API_URL}/api/auth/signup`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				firstName,
				lastName,
				username,
				verificationCode,
			}),
		});

		const data = await res.json();
		const { success, errorCode, token, refreshToken } = data || {};

		if (success) {
			const decodeTokenToken = await decodeToken(token);
			const { exp } = decodeTokenToken;
			const expires = new Date(exp * 1000);
			cookieStore.set(ACCESS_TOKEN, token, {
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
			message: errorCode,
		});
	} catch (error) {
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong, pleas try again later',
			error,
		});
	}
}
