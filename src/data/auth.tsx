'use server';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { USER_SESSION } from '@/data/constants';

// Cached helper methods makes it easy to get the same value in many places
// without manually passing it around. This discourages passing it from Server
// Component to Server Component which minimizes risk of passing it to a Client
// Component.
export const getCurrentUser = cache(async () => {
	const userSession = (await cookies()).get(USER_SESSION);
	// const decodedToken = await decryptAndValidate(authToken);
	// Don't include secret tokens or private information as public fields.
	// Use classes to avoid accidentally passing the whole object to the client.
	return userSession?.value;
});
