'use server';

import { revalidateTag } from 'next/cache';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';
import type { UserDto } from '@/schemas/user';
import { UserDtoSchema } from '@/schemas/user';

const UserPage = cursorPageSchema(UserDtoSchema);

const blockPath = (userId: string) => `/users/me/blocks/${encodeURIComponent(userId)}`;

/** Users the signed-in user blocked, most recently blocked first. Items match `/users/search`. */
export async function getBlockedUsers(cursor?: string): Promise<ActionResult<CursorPage<UserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(`/users/me/blocks?${pageParams(cursor, 20)}`)));
}

/** One-way and silent: their Polls and Comments leave your lists, and you stop following them. Idempotent. */
export async function blockUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(blockPath(userId), { method: 'POST' });
		// Blocking also removes the caller's follow, which the cached profiles count
		revalidateTag(PROFILES_TAG, { expire: 0 });
	});
}

/** Idempotent: succeeds when the user was not blocked. */
export async function unblockUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(blockPath(userId), { method: 'DELETE' });
	});
}
