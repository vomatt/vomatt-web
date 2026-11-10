'use server';

import { z } from 'zod';

import { type ActionResult, attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';
import { type UserDto, UserDtoSchema } from '@/schemas/user';

import { MyOfficialSchema, type OfficialMember, OfficialMemberSchema, type OfficialRole } from './schema';

const membersPath = (officialId: string, userId?: string) =>
	`/officials/${encodeURIComponent(officialId)}/members${userId ? `/${encodeURIComponent(userId)}` : ''}`;

/** The official accounts the signed-in user belongs to (their own, even while acting as one). */
export async function listMyOfficials() {
	return attempt(async () => z.array(MyOfficialSchema).parse(await apiClient('/users/me/officials')));
}

/** Any signed-in user may; they become the new account's first OWNER. 409 `user.username.taken` when the username is in use. */
export async function createOfficial(username: string, displayName: string): Promise<ActionResult<UserDto>> {
	return attempt(async () =>
		UserDtoSchema.parse(await apiClient('/officials', { method: 'POST', body: JSON.stringify({ username, displayName }) }))
	);
}

/** Any member may list; others get 403 `official.not_member`. */
export async function listMembers(officialId: string): Promise<ActionResult<OfficialMember[]>> {
	return attempt(async () => z.array(OfficialMemberSchema).parse(await apiClient(membersPath(officialId))));
}

/** OWNER or ADMIN; only an OWNER grants OWNER. */
export async function addMember(officialId: string, userId: string, role: OfficialRole): Promise<ActionResult<OfficialMember>> {
	return attempt(async () =>
		OfficialMemberSchema.parse(
			await apiClient(membersPath(officialId), { method: 'POST', body: JSON.stringify({ userId, role }) })
		)
	);
}

export async function changeRole(officialId: string, userId: string, role: OfficialRole): Promise<ActionResult<OfficialMember>> {
	return attempt(async () =>
		OfficialMemberSchema.parse(
			await apiClient(membersPath(officialId, userId), { method: 'PATCH', body: JSON.stringify({ role }) })
		)
	);
}

/** Removes a member; with the caller's own id, leaves. */
export async function removeMember(officialId: string, userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(membersPath(officialId, userId), { method: 'DELETE' });
	});
}

/** The caller (an OWNER) hands OWNER to a member and becomes ADMIN. */
export async function transferOwner(officialId: string, userId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(`/officials/${encodeURIComponent(officialId)}/owner`, {
			method: 'POST',
			body: JSON.stringify({ userId }),
		});
	});
}
