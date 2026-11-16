'use server';

import { refresh, updateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { ACT_AS } from '@/data/constants';
import { type ActionResult, attempt } from '@/lib/api/action';
import { getActingCommunityId } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { PROFILES_TAG } from '@/lib/api/constants';
import { type UserDto, UserDtoSchema } from '@/schemas/user';

import {
	type CommunityInvitation,
	type CommunityInvitationDetail,
	CommunityInvitationDetailSchema,
	CommunityInvitationSchema,
	type CommunityMember,
	CommunityMemberSchema,
	type CommunityRole,
	type MyCommunity,
	MyCommunitySchema,
} from './schema';

const communityPath = (communityId: string) => `/communities/${encodeURIComponent(communityId)}`;
const invitationsPath = (communityId: string) => `${communityPath(communityId)}/invitations`;
const membersPath = (communityId: string, userId?: string) =>
	`${communityPath(communityId)}/members${userId ? `/${encodeURIComponent(userId)}` : ''}`;

/** The community accounts the signed-in user belongs to (their own, even while acting as one). */
export async function listMyCommunities() {
	return attempt(async () => z.array(MyCommunitySchema).parse(await apiClient('/users/me/communities')));
}

/** Any signed-in user may; they become the new account's first OWNER. 409 `user.username.taken` when the username is in use. */
export async function createCommunity(username: string, displayName: string): Promise<ActionResult<UserDto>> {
	return attempt(async () => {
		// The person owns it, even while acting as another account
		const created = UserDtoSchema.parse(
			await apiClient('/communities', { method: 'POST', body: JSON.stringify({ username, displayName }), actAs: false })
		);
		// The layout's list of accounts to act as now includes it
		refresh();
		return created;
	});
}

/** Any member may list; others get 403 `community.not_member`. */
export async function listMembers(communityId: string): Promise<ActionResult<CommunityMember[]>> {
	return attempt(async () => z.array(CommunityMemberSchema).parse(await apiClient(membersPath(communityId))));
}

/**
 * OWNER or ADMIN; only an OWNER grants OWNER. Exactly one of `userId` or `email`: the invitee joins only by accepting.
 * 404 `user.not_found`, 400 `community.member.invalid`, 409 `community.member.exists` (by id only) or `community.invitation.exists`.
 */
export async function inviteMember(
	communityId: string,
	invitee: { userId: string } | { email: string },
	role: CommunityRole
): Promise<ActionResult<CommunityInvitation>> {
	return attempt(async () =>
		CommunityInvitationSchema.parse(
			await apiClient(invitationsPath(communityId), { method: 'POST', body: JSON.stringify({ ...invitee, role }) })
		)
	);
}

/** OWNER or ADMIN; oldest first, expired ones included. */
export async function listInvitations(communityId: string): Promise<ActionResult<CommunityInvitation[]>> {
	return attempt(async () => z.array(CommunityInvitationSchema).parse(await apiClient(invitationsPath(communityId))));
}

/** OWNER or ADMIN; 404 `community.invitation.not_found` once it is gone. */
export async function revokeInvitation(communityId: string, invitationId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`${invitationsPath(communityId)}/${encodeURIComponent(invitationId)}`, { method: 'DELETE' });
	});
}

/**
 * For the invitee, as the person. 404 `community.invitation.not_found` when it isn't theirs, has expired, was withdrawn
 * or answered, or its community is suspended: the API doesn't say which.
 */
export async function getCommunityInvitation(invitationId: string): Promise<ActionResult<CommunityInvitationDetail>> {
	return attempt(async () =>
		CommunityInvitationDetailSchema.parse(
			await apiClient(`/community-invitations/${encodeURIComponent(invitationId)}`, { actAs: false })
		)
	);
}

/**
 * For the invitee, as the person (refused while acting, 403 `community.role_forbidden`): they become a member and keep any role they had.
 * 404 `community.invitation.not_found`, 403 `community.locked`, 403 `community.limit_reached` for an OWNER invitation over their plan.
 */
export async function acceptCommunityInvitation(invitationId: string): Promise<ActionResult<MyCommunity>> {
	return attempt(async () => {
		const joined = MyCommunitySchema.parse(
			await apiClient(`/community-invitations/${encodeURIComponent(invitationId)}/accept`, { method: 'POST', actAs: false })
		);
		// The layout's list of accounts to act as now includes it
		refresh();
		return joined;
	});
}

export async function declineCommunityInvitation(invitationId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/community-invitations/${encodeURIComponent(invitationId)}/decline`, { method: 'POST', actAs: false });
	});
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

/** OWNER only. */
export async function deleteCommunity(communityId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(communityPath(communityId), { method: 'DELETE' });
		if ((await getActingCommunityId()) === communityId) (await cookies()).delete(ACT_AS);
		updateTag(PROFILES_TAG);
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
