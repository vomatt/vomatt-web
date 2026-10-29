'use server';

import { type ActionResult, attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import type { SignedInSession } from '@/types/user';

/** Every device that can still refresh, most recently active first. */
export async function getSessions(): Promise<ActionResult<SignedInSession[]>> {
	return attempt(() => apiClient<SignedInSession[]>('/users/me/sessions', { cache: 'no-store' }));
}

/** Its refresh token stops working and its access tokens are refused from the next request. 404 `auth.session_not_found` when it is already gone. */
export async function revokeSession(sessionId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/users/me/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
	});
}

/** Signs out every device but this one; succeeds when there are none. */
export async function revokeOtherSessions(): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient('/users/me/sessions?scope=others', { method: 'DELETE' });
	});
}
