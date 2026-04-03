'use server';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { ACCESS_TOKEN } from '@/data/constants';
import { decodeToken } from '@/lib/api/auth';

// Cached helper methods makes it easy to get the same value in many places
// without manually passing it around. This discourages passing it from Server
// Component to Server Component which minimizes risk of passing it to a Client
// Component.
// Token refresh on expiry is handled in middleware (proxy.tsx) before this runs,
// so by the time getUserSession is called the access token cookie is always fresh.
export const getUserSession = cache(async () => {
	const accessTokenCookie = (await cookies()).get(ACCESS_TOKEN);
	if (accessTokenCookie?.value) {
		const userInfo = await decodeToken(accessTokenCookie.value);
		if (userInfo) return userInfo;
	}
	return null;
});
