'use server';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { USER_SESSION } from '@/data/constants';

const secretKey = 'ericjoeklaus';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(payload.expires)
		.sign(key);
}

export async function decrypt(input: string): Promise<any> {
	const { payload } = await jwtVerify(input, key, {
		algorithms: ['HS256'],
	});

	return payload;
}

export async function logout() {
	(await cookies()).set('USER_SESSION', '', { expires: new Date(0) });
}

export async function getUserSession() {
	const cookieStore = await cookies();
	const session = cookieStore.get(USER_SESSION)?.value;
	if (!session) return null;

	return session;
}

export async function updateUserSession(request: NextRequest) {
	const session = request.cookies.get(USER_SESSION)?.value;
	if (!session) return;

	const parsed = await decrypt(session);
	parsed.expires = new Date(Date.now() + 10 * 1000);
	const res = NextResponse.next();
	res.cookies.set({
		name: USER_SESSION,
		value: await encrypt(parsed),
		httpOnly: true,
		expires: parsed.expires,
	});
	return res;
}
