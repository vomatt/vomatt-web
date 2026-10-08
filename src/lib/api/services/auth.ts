'use server';

import { redirect } from 'next/navigation';

import { clearAuthTokens, getTokens, setAuthTokens } from '@/lib/api/auth';
import { type AuthErrorKey, toAuthErrorKey } from '@/lib/api/auth-errors';
import { ApiError, publicFetch } from '@/lib/api/client';
import { readAuthTokens } from '@/lib/api/tokens';

type AuthFailure = { status: 'ERROR'; error: AuthErrorKey };

function toFailure(error: unknown): AuthFailure {
	if (error instanceof ApiError) {
		return { status: 'ERROR', error: toAuthErrorKey(error.data?.errorCode, error.statusCode) };
	}
	return { status: 'ERROR', error: 'serverError' };
}

function postJson(endpoint: string, body: unknown) {
	return publicFetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		cache: 'no-store',
	});
}

/**
 * Emails a one-time code. The same code signs in an existing account or
 * creates a new one, so `isNewUser` only changes the wording in the UI.
 */
export async function requestOtp(
	email: string
): Promise<{ status: 'SUCCESS'; isNewUser: boolean } | AuthFailure> {
	const normalized = email.trim().toLowerCase();
	try {
		// In order: a failed check must not leave a sent code and a running resend cooldown
		const exists = await postJson('/auth/check-email', { email: normalized });
		await postJson('/auth/send-otp', { email: normalized });
		return { status: 'SUCCESS', isNewUser: exists?.exists === false };
	} catch (error) {
		return toFailure(error);
	}
}

/** Verifies the code and starts the session. */
export async function verifyOtp(
	email: string,
	code: string
): Promise<{ status: 'SUCCESS' } | AuthFailure> {
	try {
		const data = await postJson('/auth/verify-otp', {
			email: email.trim().toLowerCase(),
			code,
		});
		const tokens = readAuthTokens(data);
		if (!tokens) return { status: 'ERROR', error: 'serverError' };
		await setAuthTokens(tokens);
		return { status: 'SUCCESS' };
	} catch (error) {
		return toFailure(error);
	}
}

/**
 * Revokes the refresh token on the backend, then clears the cookies. The
 * cookies are cleared even when the backend can't be reached.
 */
export async function signout() {
	const refreshToken = (await getTokens())?.refreshToken;
	if (refreshToken) {
		await postJson('/auth/logout', { refreshToken }).catch((error) => {
			console.error('Logout request failed:', error);
		});
	}
	await clearAuthTokens();
	redirect('/');
}
