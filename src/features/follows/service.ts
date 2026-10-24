'use server';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';
import { findUserByUsername } from '@/lib/api/find-user';
import type { UserDto } from '@/schemas/user';
import { UserDtoSchema } from '@/schemas/user';

const UserPage = cursorPageSchema(UserDtoSchema);

const followPath = (userId: string) => `/users/me/follows/${encodeURIComponent(userId)}`;

/** Users the signed-in user follows, most recently followed first. Items match `/users/search`. */
export async function getFollowedUsers(cursor?: string): Promise<ActionResult<CursorPage<UserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(`/users/me/follows?${pageParams(cursor, 20)}`)));
}

/** Idempotent: succeeds when the user was already followed. */
export async function followUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(followPath(userId), { method: 'POST' });
	});
}

/** Idempotent: succeeds when the user was not followed. */
export async function unfollowUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(followPath(userId), { method: 'DELETE' });
	});
}

/** Follows by username; `found: false` when no such username turns up. */
export async function followUserByUsername(username: string): Promise<ActionResult<{ found: boolean }>> {
	return attempt(async () => {
		const user = await findUserByUsername(username);
		if (!user) return { found: false };
		await apiClient(followPath(user.id), { method: 'POST' });
		return { found: true };
	});
}
