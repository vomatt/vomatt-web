import { NextRequest, NextResponse } from 'next/server';

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
		const { success, errorCode } = data || {};

		if (success) {
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
