'use server';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';
import type { FollowUserDto } from '@/schemas/user';
import { FollowUserDtoSchema } from '@/schemas/user';

const UserPage = cursorPageSchema(FollowUserDtoSchema);

const followPath = (userId: string) => `/users/me/follows/${encodeURIComponent(userId)}`;

/** Users the signed-in user follows, most recently followed first. Items match `/users/search`. */
export async function getFollowedUsers(cursor?: string): Promise<ActionResult<CursorPage<FollowUserDto>>> {
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

const userListPath = (username: string, list: 'followers' | 'following' | 'mutual-followers', cursor?: string) =>
	`/users/${encodeURIComponent(username)}/${list}?${pageParams(cursor, 20)}`;

/** Who follows `username`, most recently followed first. Signed-in only; items say whether you follow them and they follow you. */
export async function getFollowers(username: string, cursor?: string): Promise<ActionResult<CursorPage<FollowUserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(userListPath(username, 'followers', cursor))));
}

/** Whom `username` follows, most recently followed first. Signed-in only; items say whether you follow them and they follow you. */
export async function getFollowing(username: string, cursor?: string): Promise<ActionResult<CursorPage<FollowUserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(userListPath(username, 'following', cursor))));
}

/** `username`'s followers whom you follow, in follower list order. Signed-in only; empty on your own profile. */
export async function getMutualFollowers(
	username: string,
	cursor?: string
): Promise<ActionResult<CursorPage<FollowUserDto>>> {
	return attempt(async () => UserPage.parse(await apiClient(userListPath(username, 'mutual-followers', cursor))));
}
