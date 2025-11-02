'use server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

import {
	ACCESS_TOKEN,
	ACCESS_TOKEN_EXPIRY,
	REFRESH_TOKEN,
	REFRESH_TOKEN_EXPIRY,
} from '@/data/constants';
import { AuthTokens, RefreshTokenResponse } from '@/types';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function decodeToken(token: string): Promise<any> {
	try {
		const { payload } = await jwtVerify(token, encodedKey, {
			algorithms: ['HS512'],
		});

		return payload;
	} catch (error) {
		console.log('Failed to decode token');
	}
}

export async function getTokens(): Promise<{
	accessToken: string;
	refreshToken: string;
} | null> {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get(ACCESS_TOKEN)?.value || '';
	const refreshToken = cookieStore.get(REFRESH_TOKEN)?.value || '';

	if (!accessToken || !refreshToken) return null;
	return { accessToken, refreshToken };
}

// Set tokens in cookies (server-side)
export async function setAuthTokens(tokens: AuthTokens) {
	const { accessToken, refreshToken } = tokens;

	const cookieStore = await cookies();
	const decodeTokenToken = await decodeToken(accessToken);
	const { exp } = decodeTokenToken;
	const expires = exp ? new Date(exp * 1000) : ACCESS_TOKEN_EXPIRY;

	cookieStore.set(ACCESS_TOKEN, accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		expires,
		path: '/',
	});

	cookieStore.set(REFRESH_TOKEN, refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
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

export async function logout() {
	const cookieStore = await cookies();
	cookieStore.set(ACCESS_TOKEN, '', { expires: new Date(0) });
	cookieStore.set(REFRESH_TOKEN, '', { expires: new Date(0) });
}

export async function clearAuthTokens() {
	const cookieStore = await cookies();
	cookieStore.delete(ACCESS_TOKEN);
	cookieStore.delete(REFRESH_TOKEN);
}
