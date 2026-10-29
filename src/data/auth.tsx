import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { ACCESS_TOKEN } from '@/data/constants';
import { decodeToken } from '@/lib/api/auth';
import { ApiError, AuthError } from '@/lib/api/client';
import { getMyProfile as fetchMyProfile } from '@/lib/api/services/users';
import { loginHref } from '@/lib/routes';
import { MyProfile } from '@/types/user';

export interface Session {
	/** The user id. */
	sub: string;
	exp?: number;
	iat?: number;
}

// Cached helper methods makes it easy to get the same value in many places
// without manually passing it around. This discourages passing it from Server
// Component to Server Component which minimizes risk of passing it to a Client
// Component.
// Token refresh on expiry is handled in middleware (proxy.tsx) before this runs,
// so by the time getUserSession is called the access token cookie is always fresh.
export const getUserSession = cache(async (): Promise<Session | null> => {
	const accessTokenCookie = (await cookies()).get(ACCESS_TOKEN);
	if (accessTokenCookie?.value) {
		const payload = await decodeToken(accessTokenCookie.value);
		if (payload?.sub) {
			return { sub: payload.sub, exp: payload.exp, iat: payload.iat };
		}
	}
	return null;
});

/** The signed-in user's profile; `gone` when the token is live but its account was deleted elsewhere. */
const loadMyProfile = cache(async (): Promise<{ profile: MyProfile | null; gone?: true }> => {
	const session = await getUserSession();
	if (!session) return { profile: null };

	try {
		return { profile: await fetchMyProfile() };
	} catch (error) {
		if (error instanceof AuthError) return { profile: null };
		// Signed out, not a broken page
		if (error instanceof ApiError && error.data?.errorCode === 'user.not_found') return { profile: null, gone: true };
		throw error;
	}
});

export const getMyProfile = async (): Promise<MyProfile | null> => (await loadMyProfile()).profile;

/**
 * The login link for this visitor. A token the API refused (revoked, or its account deleted) still verifies
 * in the proxy, which would send a plain /login straight back; `session_expired` lets it through.
 */
export async function getLoginHref(redirect?: string): Promise<string> {
	const [session, { profile, gone }] = await Promise.all([getUserSession(), loadMyProfile()]);
	return loginHref({ redirect, sessionExpired: gone ? 'deleted' : session && !profile ? '1' : undefined });
}

/** Sends a visitor with no profile to sign in. */
export async function redirectToLogin(path: string): Promise<never> {
	redirect(await getLoginHref(path));
}
