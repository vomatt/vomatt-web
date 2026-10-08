import 'server-only';

import { cookies } from 'next/headers';

import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/data/constants';
import {
	AccessTokenPayload,
	buildAuthCookies,
	verifyAccessToken,
} from '@/lib/api/tokens';
import { AuthTokens } from '@/types';

// Server-only on purpose: as a 'use server' module every export here would be
// a Server Action, and getTokens() would hand httpOnly tokens to any caller.

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

/** Only works where cookies are writable: Server Actions and Route Handlers. */
export async function setAuthTokens(tokens: AuthTokens) {
	const cookieStore = await cookies();
	for (const { name, value, options } of buildAuthCookies(tokens)) {
		cookieStore.set(name, value, options);
	}
}

export async function clearAuthTokens() {
	const cookieStore = await cookies();
	cookieStore.delete(ACCESS_TOKEN);
	cookieStore.delete(REFRESH_TOKEN);
}
