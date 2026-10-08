import { decodeJwt, JWTPayload, jwtVerify } from 'jose';

import {
	ACCESS_TOKEN,
	ACCESS_TOKEN_EXPIRY,
	ACCESS_TOKEN_REFRESH_LEEWAY,
	REFRESH_TOKEN,
	REFRESH_TOKEN_EXPIRY,
} from '@/data/constants';
import { API_BASE_PATH } from '@/lib/api/constants';
import { AuthTokens } from '@/types';

// Shared by the proxy (middleware) and server code, so it must not use
// next/headers or carry a 'use server' directive.

/** Claims the backend puts in the access token. `sub` is the user id. */
export interface AccessTokenPayload extends JWTPayload {
	email?: string;
	roles?: string[];
}

const encodedKey = new TextEncoder().encode(process.env.SESSION_SECRET);

// The backend signs with HMAC-SHA and JJWT picks the hash from the secret's length.
const HMAC_ALGORITHMS = ['HS256', 'HS384', 'HS512'];

/** Returns the verified payload, or null if the token is invalid or expired. */
export async function verifyAccessToken(
	token: string
): Promise<AccessTokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, encodedKey, {
			algorithms: HMAC_ALGORITHMS,
		});
		return payload as AccessTokenPayload;
	} catch {
		return null;
	}
}

/** True when the payload expires within the refresh leeway. */
export function isExpiringSoon(payload: AccessTokenPayload, now = Date.now()) {
	return !!payload.exp && payload.exp * 1000 - now < ACCESS_TOKEN_REFRESH_LEEWAY * 1000;
}

/**
 * `rejected`: the backend refused the refresh token, so the session is over.
 * `unavailable`: the backend couldn't be asked; the session may still be fine.
 */
export type RefreshResult =
	| { status: 'ok'; tokens: AuthTokens }
	| { status: 'rejected' }
	| { status: 'unavailable' };

// Concurrent callers holding the same refresh token share one request. The
// backend rotates refresh tokens and revokes every session when a used token
// comes back after its grace window, so never send the same token twice.
const inFlightRefreshes = new Map<string, Promise<RefreshResult>>();

export function requestTokenRefresh(refreshToken: string): Promise<RefreshResult> {
	const pending = inFlightRefreshes.get(refreshToken);
	if (pending) return pending;

	const request = fetchRefreshedTokens(refreshToken).finally(() => {
		inFlightRefreshes.delete(refreshToken);
	});
	inFlightRefreshes.set(refreshToken, request);
	return request;
}

/** Reads `{ token, refreshToken }` from the ApiResponse envelope or a bare body. */
export function readAuthTokens(body: unknown): AuthTokens | null {
	const record = (body ?? {}) as Record<string, any>;
	const data = record.data && typeof record.data === 'object' ? record.data : record;
	const accessToken = data.token ?? data.accessToken;
	if (typeof accessToken !== 'string' || typeof data.refreshToken !== 'string') {
		return null;
	}
	return { accessToken, refreshToken: data.refreshToken };
}

async function fetchRefreshedTokens(refreshToken: string): Promise<RefreshResult> {
	try {
		const response = await fetch(
			`${process.env.API_URL}${API_BASE_PATH}/auth/refresh`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken }),
				cache: 'no-store',
			}
		);
		if (response.status >= 500 || response.status === 429) return { status: 'unavailable' };
		if (!response.ok) return { status: 'rejected' };
		const tokens = readAuthTokens(await response.json());
		return tokens ? { status: 'ok', tokens } : { status: 'rejected' };
	} catch (error) {
		console.error('Token refresh failed:', error);
		return { status: 'unavailable' };
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
