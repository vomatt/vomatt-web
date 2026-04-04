'use server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
	ACCESS_TOKEN,
	ACCESS_TOKEN_EXPIRY,
	REFRESH_TOKEN,
	REFRESH_TOKEN_EXPIRY,
} from '@/data/constants';
import { API_BASE_PATH } from '@/lib/api/constants';
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

	if (!accessToken && !refreshToken) return null;
	return { accessToken, refreshToken };
}

// Set tokens in cookies (server-side)
export async function setAuthTokens(tokens: AuthTokens) {
	const { accessToken, refreshToken } = tokens;

	const cookieStore = await cookies();
	const decoded = await decodeToken(accessToken);
	const exp = decoded?.exp as number | undefined;
	const expires = exp
		? new Date(exp * 1000)
		: new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);

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
		expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
		path: '/',
	});
}

export async function refreshTokens(
	refreshToken: string
): Promise<RefreshTokenResponse | null> {
	try {
		const refreshUrl = `${process.env.API_URL}${API_BASE_PATH}/auth/refreshToken`;
		const response = await fetch(refreshUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ refreshToken }),
		});

		if (!response.ok) return null;

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Token refresh failed:', error);
		return null;
	}
}

export async function logout() {
	const cookieStore = await cookies();
	cookieStore.delete(ACCESS_TOKEN);
	cookieStore.delete(REFRESH_TOKEN);
	redirect('/login');
}

export async function clearAuthTokens() {
	const cookieStore = await cookies();
	cookieStore.delete(ACCESS_TOKEN);
	cookieStore.delete(REFRESH_TOKEN);
}
