'use server';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { USER_SESSION } from '@/data/constants';
import { decrypt } from '@/lib/auth';

// Cached helper methods makes it easy to get the same value in many places
// without manually passing it around. This discourages passing it from Server
// Component to Server Component which minimizes risk of passing it to a Client
// Component.
export const getCurrentUser = cache(async () => {
	const userSession = (await cookies()).get(USER_SESSION);
	if (userSession?.value) {
		const userInfo = await decrypt(userSession?.value);
		return userInfo;
	}
	return null;
});
