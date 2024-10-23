'use server';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { USER_LANG, USER_SESSION } from '@/data/constants';
// import { i18n } from '@/languages';

const secretKey = 'secret';
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

export async function getUserSession() {
	const session = (await cookies()).get(USER_SESSION)?.value;
	if (!session) return null;
	return await decrypt(session);
}

// export async function getUserLanguage() {
// 	const lang = cookies().get(USER_LANG)?.value || i18n.base;
// 	return lang;
// }

export async function updateSession(request: NextRequest) {
	const session = request.cookies.get(USER_SESSION)?.value;
	if (!session) return;

	// Refresh the session so it doesn't expire
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
