'use server';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';
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

const relationPath = (username: string, list: 'followers' | 'following') =>
	`/users/${encodeURIComponent(username)}/${list}`;

/** Who follows `username`, most recent first. Signed in only; items carry public fields. */
export async function getFollowers(username: string, cursor?: string): Promise<ActionResult<CursorPage<UserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(`${relationPath(username, 'followers')}?${pageParams(cursor, 20)}`)));
}

/** Who `username` follows, most recent first. Signed in only; items carry public fields. */
export async function getFollowing(username: string, cursor?: string): Promise<ActionResult<CursorPage<UserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(`${relationPath(username, 'following')}?${pageParams(cursor, 20)}`)));
}
