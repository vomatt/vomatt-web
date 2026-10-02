import { decodeJwt, JWTPayload, jwtVerify } from 'jose';

import {
	ACCESS_TOKEN,
	ACCESS_TOKEN_EXPIRY,
	REFRESH_TOKEN,
	REFRESH_TOKEN_EXPIRY,
} from '@/data/constants';
import { API_BASE_PATH } from '@/lib/api/constants';
import { RefreshTokenResponse } from '@/schemas/auth';
import { AuthTokens } from '@/types';

// Shared by the proxy (middleware) and server code, so it must not use
// next/headers or carry a 'use server' directive.

export interface AccessTokenPayload extends JWTPayload {
	username?: string;
}

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

/** Returns the verified payload, or null if the token is invalid or expired. */
export async function verifyAccessToken(
	token: string
): Promise<AccessTokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, encodedKey, {
			algorithms: ['HS512'],
		});
		return payload as AccessTokenPayload;
	} catch {
		return null;
	}
}

// Concurrent callers holding the same refresh token share one request, so
// parallel 401s don't race to use a token the backend may rotate.
const inFlightRefreshes = new Map<string, Promise<AuthTokens | null>>();

export function requestTokenRefresh(
	refreshToken: string
): Promise<AuthTokens | null> {
	const pending = inFlightRefreshes.get(refreshToken);
	if (pending) return pending;

	const request = fetchRefreshedTokens(refreshToken).finally(() => {
		inFlightRefreshes.delete(refreshToken);
	});
	inFlightRefreshes.set(refreshToken, request);
	return request;
}

async function fetchRefreshedTokens(
	refreshToken: string
): Promise<AuthTokens | null> {
	try {
		const response = await fetch(
			`${process.env.API_URL}${API_BASE_PATH}/auth/refreshToken`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken }),
			}
		);
		if (!response.ok) return null;

		// signin/signup return `token`; accept it here too until the backend unifies.
		const data: RefreshTokenResponse & { token?: string } = await response.json();
		const accessToken = data?.accessToken ?? data?.token;
		if (!accessToken) return null;

		return {
			accessToken,
			// Backend may not rotate the refresh token; keep the current one.
			refreshToken: data?.refreshToken ?? refreshToken,
		};
	} catch (error) {
		console.error('Token refresh failed:', error);
		return null;
	}
}

// Tokens come straight from the backend, so reading `exp` needs no verification.
function readExpiry(token: string): number | undefined {
	try {
		return decodeJwt(token).exp;
	} catch {
		return undefined;
	}
}

/** Cookie definitions for both tokens, in a shape usable by next/headers and NextResponse. */
export function buildAuthCookies(tokens: AuthTokens) {
	const exp = readExpiry(tokens.accessToken);
	const now = Date.now();
	const accessExpires = exp
		? new Date(exp * 1000)
		: new Date(now + ACCESS_TOKEN_EXPIRY * 1000);

	const base = {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
	} as const;

	return [
		{
			name: ACCESS_TOKEN,
			value: tokens.accessToken,
			options: { ...base, expires: accessExpires },
		},
		{
			name: REFRESH_TOKEN,
			value: tokens.refreshToken,
			options: {
				...base,
				expires: new Date(now + REFRESH_TOKEN_EXPIRY * 1000),
			},
		},
	];
}
