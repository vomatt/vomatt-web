'use server';

import { z } from 'zod';

import { type ActionResult, attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { type UserDto, UserDtoSchema } from '@/schemas/user';

import { type CommunityMember, CommunityMemberSchema, type CommunityRole, MyCommunitySchema } from './schema';

const membersPath = (communityId: string, userId?: string) =>
	`/communities/${encodeURIComponent(communityId)}/members${userId ? `/${encodeURIComponent(userId)}` : ''}`;

/** The community accounts the signed-in user belongs to (their own, even while acting as one). */
export async function listMyCommunities() {
	return attempt(async () => z.array(MyCommunitySchema).parse(await apiClient('/users/me/communities')));
}

/** Any signed-in user may; they become the new account's first OWNER. 409 `user.username.taken` when the username is in use. */
export async function createCommunity(username: string, displayName: string): Promise<ActionResult<UserDto>> {
	return attempt(async () =>
		UserDtoSchema.parse(await apiClient('/communities', { method: 'POST', body: JSON.stringify({ username, displayName }) }))
	);
}

/** Any member may list; others get 403 `community.not_member`. */
export async function listMembers(communityId: string): Promise<ActionResult<CommunityMember[]>> {
	return attempt(async () => z.array(CommunityMemberSchema).parse(await apiClient(membersPath(communityId))));
}

/** OWNER or ADMIN; only an OWNER grants OWNER. */
export async function addMember(communityId: string, userId: string, role: CommunityRole): Promise<ActionResult<CommunityMember>> {
	return attempt(async () =>
		CommunityMemberSchema.parse(
			await apiClient(membersPath(communityId), { method: 'POST', body: JSON.stringify({ userId, role }) })
		)
	);
}

export async function changeRole(communityId: string, userId: string, role: CommunityRole): Promise<ActionResult<CommunityMember>> {
	return attempt(async () =>
		CommunityMemberSchema.parse(
			await apiClient(membersPath(communityId, userId), { method: 'PATCH', body: JSON.stringify({ role }) })
		)
	);
}

/** Removes a member; with the caller's own id, leaves. */
export async function removeMember(communityId: string, userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(membersPath(communityId, userId), { method: 'DELETE' });
	});
}

/** The caller (an OWNER) hands OWNER to a member and becomes ADMIN. */
export async function transferOwner(communityId: string, userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/communities/${encodeURIComponent(communityId)}/owner`, {
			method: 'POST',
			body: JSON.stringify({ userId }),
		});
	});
}

/**
 * After the user owns more than their plan allows: keeps exactly these unlocked and locks the rest they own.
 * 400 `community.keep.invalid` unless it is exactly min(limit, owned) of their own. Sent as the person.
 */
export async function keepCommunities(communityIds: string[]): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient('/users/me/communities/keep', { method: 'POST', body: JSON.stringify({ communityIds }), actAs: false });
	});
}

/** OWNER only, with room in their plan (else 403 `community.limit_reached`). Sent as the person: the account itself is locked. */
export async function unlockCommunity(communityId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/communities/${encodeURIComponent(communityId)}/unlock`, { method: 'POST', actAs: false });
	});
}
