'use server';

import { type ActionResult, attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import type { Passkey } from '@/types/user';

/** The signed-in user's passkeys, oldest first. */
export async function getPasskeys(): Promise<ActionResult<Passkey[]>> {
	return attempt(() => apiClient<Passkey[]>('/users/me/passkeys', { cache: 'no-store' }));
}

/** It can no longer sign in; the device keeps it until the user removes it there. */
export async function deletePasskey(passkeyId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/users/me/passkeys/${encodeURIComponent(passkeyId)}`, { method: 'DELETE' });
	});
}
