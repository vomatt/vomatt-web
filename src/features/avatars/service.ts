'use server';

import { updateTag } from 'next/cache';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';

import { botAvatarUrl, isAvatarChoice } from './catalog';

/**
 * Saves one of the cast, or no character, as the signed-in user's avatar. Only a
 * known choice is accepted, so the stored value can never be a URL shown to everyone.
 */
export async function chooseAvatar(kind: string): Promise<ActionResult> {
	return attempt(async () => {
		if (!isAvatarChoice(kind)) throw new Error('Unknown avatar');
		await apiClient('/users/me', { method: 'PATCH', body: JSON.stringify({ avatarUrl: botAvatarUrl(kind) }) });
		updateTag(PROFILES_TAG);
	});
}

/**
 * Uploads a photo as the signed-in user's avatar (`file` in the form data). The API
 * crops it square and stores it; its limits come back as errorCodes (`apiError.*`).
 */
export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
	return attempt(async () => {
		const file = formData.get('file');
		if (!(file instanceof File) || file.size === 0) throw new Error('No file');
		const body = new FormData();
		body.set('file', file);
		await apiClient('/users/me/avatar', { method: 'PUT', body, isFormData: true });
		updateTag(PROFILES_TAG);
	});
}
