import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { REFRESH_TOKEN, USER_SESSION } from '@/data/constants';
import { decrypt } from '@/lib/auth';
import { getUserLanguage } from '@/lib';

export async function POST(request: NextRequest) {
	const body = await request.json();
	const { email, firstName, lastName, username } = body;
	console.log('🚀 ~ file: route.ts:11 ~ POST ~ body:', body);
	const userLang = await getUserLanguage();

	try {
		const url = `${process.env.API_URL}/user/create`;
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				lang: userLang,
			},
			body: JSON.stringify({
				email,
				firstName,
				lastName,
				userName: username,
			}),
		});
		console.log('🚀 ~ file: route.ts:29 ~ POST ~ res:', res);

		const data = await res.json();
		console.log('🚀 ~ file: route.ts:31 ~ POST ~ data:', data);
		const { status, message } = data || {};

		if (status === 'SUCCESS') {
			return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });
		}

		return NextResponse.json({
			status: 'ERROR',
			message: message,
		});
	} catch (error) {
		console.log('🚀 ~ file: route.ts:43 ~ POST ~ error:', error);
		return NextResponse.json({
			status: 'ERROR',
			message: 'Something went wrong, pleas try again later',
			error,
		});
	}
}
