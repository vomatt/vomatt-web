'use server';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { collectPages, type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';
import { searchUsers } from '@/lib/api/services/users';
import type { UserDto } from '@/schemas/user';
import { UserDtoSchema } from '@/schemas/user';

const UserPage = cursorPageSchema(UserDtoSchema);

const blockPath = (userId: string) => `/users/me/blocks/${encodeURIComponent(userId)}`;

/** Users the signed-in user blocked, most recently blocked first. Items match `/users/search`. */
export async function getBlockedUsers(cursor?: string): Promise<ActionResult<CursorPage<UserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(`/users/me/blocks?${pageParams(cursor, 20)}`)));
}

/** One-way and silent: their Polls and Comments leave your lists. Idempotent. */
export async function blockUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(blockPath(userId), { method: 'POST' });
	});
}

/** Idempotent: succeeds when the user was not blocked. */
export async function unblockUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(blockPath(userId), { method: 'DELETE' });
	});
}

/**
 * Public profiles carry no user ID, so find it through search (at most 5 pages
 * of matches) and block it. `found: false` when no such username turns up.
 */
export async function blockUserByUsername(username: string): Promise<ActionResult<{ found: boolean }>> {
	return attempt(async () => {
		const wanted = username.toLowerCase();
		const isWanted = (user: UserDto) => user.username.toLowerCase() === wanted;
		const { items } = await collectPages((cursor) => searchUsers(username, cursor ?? undefined, 50), {
			maxPages: 5,
			until: (users) => users.some(isWanted),
		});
		const user = items.find(isWanted);
		if (!user) return { found: false };
		await apiClient(blockPath(user.id), { method: 'POST' });
		return { found: true };
	});
}
