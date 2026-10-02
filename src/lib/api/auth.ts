'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/data/constants';
import {
	AccessTokenPayload,
	buildAuthCookies,
	requestTokenRefresh,
	verifyAccessToken,
} from '@/lib/api/tokens';
import { AuthTokens } from '@/types';

export async function decodeToken(
	token: string
): Promise<AccessTokenPayload | null> {
	return verifyAccessToken(token);
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
	const cookieStore = await cookies();
	for (const { name, value, options } of buildAuthCookies(tokens)) {
		cookieStore.set(name, value, options);
	}
}

export async function refreshTokens(
	refreshToken: string
): Promise<AuthTokens | null> {
	return requestTokenRefresh(refreshToken);
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
