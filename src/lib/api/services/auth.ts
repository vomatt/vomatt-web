'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { type ActionResult, attempt } from '@/lib/api/action';
import { clearAuthTokens, getTokens, setAuthTokens } from '@/lib/api/auth';
import { type AuthErrorKey, toAuthErrorKey } from '@/lib/api/auth-errors';
import { apiClient, ApiError, publicFetch } from '@/lib/api/client';
import { clientIpHeaders } from '@/lib/api/client-ip';
import { readAuthTokens } from '@/lib/api/tokens';
import type { Passkey } from '@/types/user';

type AuthFailure = { status: 'ERROR'; error: AuthErrorKey };

function toFailure(error: unknown): AuthFailure {
	if (error instanceof ApiError) {
		return { status: 'ERROR', error: toAuthErrorKey(error.data?.errorCode, error.statusCode) };
	}
	return { status: 'ERROR', error: 'serverError' };
}

async function postJson(endpoint: string, body: unknown) {
	return publicFetch(endpoint, {
		method: 'POST',
		// The OTP rate limits and lockouts are per user IP
		headers: { 'Content-Type': 'application/json', ...clientIpHeaders(await headers()) },
		body: JSON.stringify(body),
		cache: 'no-store',
	});
}

/**
 * Emails a one-time code. The same code signs in an existing account or
 * creates a new one; the API says which only once the code is verified.
 */
export async function requestOtp(email: string): Promise<{ status: 'SUCCESS' } | AuthFailure> {
	try {
		await postJson('/auth/send-otp', { email: email.trim().toLowerCase() });
		return { status: 'SUCCESS' };
	} catch (error) {
		return toFailure(error);
	}
}

/**
 * Verifies the code and starts the session. `isNewUser` is true when this
 * sign-in created the account.
 */
export async function verifyOtp(
	email: string,
	code: string
): Promise<{ status: 'SUCCESS'; isNewUser: boolean } | AuthFailure> {
	try {
		const data = await postJson('/auth/verify-otp', {
			email: email.trim().toLowerCase(),
			code,
		});
		const tokens = readAuthTokens(data);
		if (!tokens) return { status: 'ERROR', error: 'serverError' };
		await setAuthTokens(tokens);
		return { status: 'SUCCESS', isNewUser: data?.isNewUser === true };
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

/**
 * Creation options for a new passkey on the signed-in account; pass them to
 * `PublicKeyCredential.parseCreationOptionsFromJSON`. Each call issues a
 * challenge that lasts 5 minutes and is spent by one verify call.
 */
export async function getPasskeyRegistrationOptions(): Promise<ActionResult<PublicKeyCredentialCreationOptionsJSON>> {
	return attempt(() =>
		apiClient<PublicKeyCredentialCreationOptionsJSON>('/auth/passkey/register/options', {
			method: 'POST',
			cache: 'no-store',
		})
	);
}

/** Stores the passkey from `credential.toJSON()`; a failure needs new options to retry. */
export async function verifyPasskeyRegistration(
	credential: PublicKeyCredentialJSON,
	name?: string
): Promise<ActionResult<Passkey>> {
	return attempt(() =>
		apiClient<Passkey>('/auth/passkey/register/verify', {
			method: 'POST',
			body: JSON.stringify({ credential, name }),
			cache: 'no-store',
		})
	);
}
