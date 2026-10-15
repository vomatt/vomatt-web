'use server';

import { updateTag } from 'next/cache';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';

import { botAvatarUrl, isBotKind } from './catalog';

/**
 * Saves one of the cast as the signed-in user's avatar. Only a known kind is
 * accepted, so the stored value can never be a URL shown to everyone.
 */
export async function chooseAvatar(kind: string): Promise<ActionResult> {
	return attempt(async () => {
		if (!isBotKind(kind)) throw new Error('Unknown avatar');
		await apiClient('/users/me', { method: 'PATCH', body: JSON.stringify({ avatarUrl: botAvatarUrl(kind) }) });
		updateTag(PROFILES_TAG);
	});
}
