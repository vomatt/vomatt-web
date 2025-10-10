'use server';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
	ACCESS_TOKEN,
	ACCESS_TOKEN_EXPIRY,
	REFRESH_TOKEN,
	REFRESH_TOKEN_EXPIRY,
	USER_SESSION,
} from '@/data/constants';
import { AuthTokens, RefreshTokenResponse } from '@/types';

const secretKey = process.env.JWT_SECRET;

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

export async function decodeToken(token: string): Promise<any> {
	const { payload } = await jwtVerify(token, key, {
		algorithms: ['HS512'],
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

export async function getTokens(): Promise<{
	accessToken: string;
	refreshToken: string;
} | null> {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get('accessToken')?.value;
	console.log('🚀 ~ :77 ~ getTokens ~ accessToken:', accessToken);
	const refreshToken = cookieStore.get('refreshToken')?.value;

	if (!accessToken || !refreshToken) return null;
	return { accessToken, refreshToken };
}

// Set tokens in cookies (server-side)
export async function setAuthTokens(tokens: AuthTokens) {
	const cookieStore = await cookies();

	cookieStore.set(ACCESS_TOKEN, tokens.accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: ACCESS_TOKEN_EXPIRY,
		path: '/',
	});

	cookieStore.set(REFRESH_TOKEN, tokens.refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: REFRESH_TOKEN_EXPIRY,
		path: '/',
	});
}

export async function refreshTokens(
	refreshToken: string
): Promise<RefreshTokenResponse | null> {
	try {
		const refreshUrl = `${process.env.SITE_URL}/api/auth/refresh`;
		const response = await fetch(refreshUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		});

		if (!response.ok) return null;
		return await response.json();
	} catch (error) {
		console.error('Token refresh failed:', error);
		return null;
	}
}

// Helper function to clear tokens based on environment
export async function clearAuthTokens() {
	const cookieStore = await cookies();
	cookieStore.delete(ACCESS_TOKEN);
	cookieStore.delete(REFRESH_TOKEN);
}
