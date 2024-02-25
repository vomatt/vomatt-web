import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { encrypt } from '@/lib/auth';

export async function POST(request: NextRequest) {
	const body = await request.json();
	const { email } = body;

	// const res = await fetch('https://data.mongodb-api.com/...', {
	// 	method: 'POST',
	// 	headers: {
	// 		'Content-Type': 'application/json',
	// 		'API-Key': process.env.DATA_API_KEY!,
	// 	},
	// 	body: JSON.stringify({ time: new Date().toISOString() }),
	// });

	// const data = await res.json();

	const user = { email, name: 'Klaus CHin' };
	const expires = new Date(Date.now() + 10 * 1000);
	const session = await encrypt({ user, expires });

	cookies().set('userSession', session, { expires, httpOnly: true });
	return NextResponse.json(user);
}
