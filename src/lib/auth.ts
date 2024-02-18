import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = 'secret';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('10 sec from now')
		.sign(key);
}

export async function decrypt(input: string): Promise<any> {
	const { payload } = await jwtVerify(input, key, {
		algorithms: ['HS256'],
	});
	return payload;
}

export async function login(formData: FormData) {
	// Verify credentials && get the user

	const user = { email: formData.get('email'), name: 'Klaus' };

	// Create the session
	const expires = new Date(Date.now() + 10 * 1000);
	const session = await encrypt({ user, expires });

	// Save the session in a cookie
	cookies().set('userSession', session, { expires, httpOnly: true });
}

export async function logout() {
	// Destroy the session
	cookies().set('userSession', '', { expires: new Date(0) });
}

export async function getUserSession() {
	const session = cookies().get('userSession')?.value;
	if (!session) return null;
	return await decrypt(session);
}

export async function updateUserSession(request: NextRequest) {
	const session = request.cookies.get('userSession')?.value;
	if (!session) return;

	// Refresh the session so it doesn't expire
	const parsed = await decrypt(session);
	parsed.expires = new Date(Date.now() + 10 * 1000);
	const res = NextResponse.next();
	res.cookies.set({
		name: 'session',
		value: await encrypt(parsed),
		httpOnly: true,
		expires: parsed.expires,
	});
	return res;
}
