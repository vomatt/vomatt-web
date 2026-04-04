'use server';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { ACCESS_TOKEN } from '@/data/constants';
import { decodeToken } from '@/lib/api/auth';
import { AuthError } from '@/lib/api/client';
import { getMyProfile as fetchMyProfile } from '@/lib/api/services/users';
import { MyProfile } from '@/types/user';

export interface Session {
	sub: string;
	exp: number;
	iat: number;
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

export const getMyProfile = cache(async (): Promise<MyProfile | null> => {
	const session = await getUserSession();
	if (!session) return null;

	try {
		return await fetchMyProfile();
	} catch (error) {
		if (error instanceof AuthError) return null;
		throw error;
	}
});
