'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { clearAuthTokens, getTokens } from '@/lib/api/auth';
import { publicFetch } from '@/lib/api/client';
import { clientIpHeaders } from '@/lib/api/client-ip';

/**
 * Signs out as `signout()` does, then goes to login with this Poll as the redirect, for an
 * Invitation sent to another account.
 */
export async function switchAccount(pollId: string) {
	const refreshToken = (await getTokens())?.refreshToken;
	if (refreshToken) {
		await publicFetch('/auth/logout', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...clientIpHeaders(await headers()) },
			body: JSON.stringify({ refreshToken }),
			cache: 'no-store',
		}).catch((error) => {
			console.error('Logout request failed:', error);
		});
	}
	await clearAuthTokens();
	redirect(`/login?${new URLSearchParams({ redirect: `/poll/${encodeURIComponent(pollId)}` })}`);
}
