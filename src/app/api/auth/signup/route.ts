import { NextRequest, NextResponse } from 'next/server';

import { setAuthTokens } from '@/lib/api/auth';

export async function POST(request: NextRequest) {
	const body = await request.json();
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
			await setAuthTokens({ accessToken: token, refreshToken });
			return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });
		}

		return NextResponse.json({
			status: 'ERROR',
			message: errorCode,
		});
	} catch (error) {
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong, please try again later',
			error,
		});
	}
}
