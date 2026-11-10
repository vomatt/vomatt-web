'use server';

import { updateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { ACT_AS } from '@/data/constants';
import { type ActionResult, attempt } from '@/lib/api/action';
import { getActingCommunityId } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';
import { type UserDto, UserDtoSchema } from '@/schemas/user';

import { type CommunityMember, CommunityMemberSchema, type CommunityRole, MyCommunitySchema } from './schema';

const communityPath = (communityId: string) => `/communities/${encodeURIComponent(communityId)}`;
const membersPath = (communityId: string, userId?: string) =>
	`${communityPath(communityId)}/members${userId ? `/${encodeURIComponent(userId)}` : ''}`;

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
		await apiClient(`${communityPath(communityId)}/owner`, {
			method: 'POST',
			body: JSON.stringify({ userId }),
		});
	});
}

/** OWNER or ADMIN; an omitted field stays as it is, and an empty bio clears it. */
export async function updateCommunity(communityId: string, changes: { displayName?: string; bio?: string }): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(communityPath(communityId), { method: 'PATCH', body: JSON.stringify(changes) });
		updateTag(PROFILES_TAG);
	});
}

/** OWNER or ADMIN; `file` in the form data, with the same limits and errorCodes as the user's own avatar. */
export async function uploadCommunityAvatar(communityId: string, formData: FormData): Promise<ActionResult> {
	return attempt(async () => {
		const file = formData.get('file');
		if (!(file instanceof File) || file.size === 0) throw new Error('No file');
		const body = new FormData();
		body.set('file', file);
		await apiClient(`${communityPath(communityId)}/avatar`, { method: 'PUT', body, isFormData: true });
		updateTag(PROFILES_TAG);
	});
}

/** OWNER only. Acting as the deleted account ends with it. */
export async function deleteCommunity(communityId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(communityPath(communityId), { method: 'DELETE' });
		if ((await getActingCommunityId()) === communityId) (await cookies()).delete(ACT_AS);
		updateTag(PROFILES_TAG);
	});
}
