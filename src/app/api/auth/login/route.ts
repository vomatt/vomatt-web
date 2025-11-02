import { NextRequest, NextResponse } from 'next/server';
import { setAuthTokens } from '@/lib/auth';

export async function POST(request: NextRequest) {
	const body = await request.json();
	const { email, verificationCode } = body;

	try {
		const url = `${process.env.API_URL}/api/auth/signin`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email,
				verificationCode,
			}),
		});

		const data = await res.json();
		const { success, errorCode, token, refreshToken } = data || {};
		const tokens = { accessToken: token, refreshToken };

		if (success && token) {
			setAuthTokens(tokens);

			return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });
		}

		return NextResponse.json({
			status: 'ERROR',
			message: errorCode,
		});
	} catch (error) {
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong',
			error,
		});
	}
}
