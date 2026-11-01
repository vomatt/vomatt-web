'use server';

import { revalidateTag } from 'next/cache';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';

import { type FollowUserDto, FollowUserDtoSchema } from './schema';

const FollowUserPage = cursorPageSchema(FollowUserDtoSchema);

const followPath = (userId: string) => `/users/me/follows/${encodeURIComponent(userId)}`;

/** Idempotent: succeeds when the user was already followed. */
export async function followUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(followPath(userId), { method: 'POST' });
		// Both profiles' counts changed. Expire without re-rendering: the button already shows the change
		revalidateTag(PROFILES_TAG, { expire: 0 });
	});
}

/** Idempotent: succeeds when the user was not followed. */
export async function unfollowUser(userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(followPath(userId), { method: 'DELETE' });
		revalidateTag(PROFILES_TAG, { expire: 0 });
	});
}

const userListPath = (username: string, list: 'followers' | 'following' | 'mutual-followers', cursor?: string) =>
	`/users/${encodeURIComponent(username)}/${list}?${pageParams(cursor, 20)}`;

/** Who follows `username`, most recently followed first. Signed-in only; each item says how it relates to the viewer. */
export async function getFollowers(username: string, cursor?: string): Promise<ActionResult<CursorPage<FollowUserDto>>> {
	return attempt(async () => FollowUserPage.parse(await apiClient(userListPath(username, 'followers', cursor))));
}

/** Whom `username` follows, most recently followed first. Signed-in only; each item says how it relates to the viewer. */
export async function getFollowing(username: string, cursor?: string): Promise<ActionResult<CursorPage<FollowUserDto>>> {
	return attempt(async () => FollowUserPage.parse(await apiClient(userListPath(username, 'following', cursor))));
}

/** Who follows `username` among the people the viewer follows, most recently followed first. Signed-in only. */
export async function getMutualFollowers(username: string, cursor?: string): Promise<ActionResult<CursorPage<FollowUserDto>>> {
	return attempt(async () => FollowUserPage.parse(await apiClient(userListPath(username, 'mutual-followers', cursor))));
}
