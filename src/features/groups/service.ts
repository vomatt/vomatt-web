'use server';

import { z } from 'zod';

import { personPath } from '@/features/polls/invitees';
import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient } from '@/lib/api/client';

import { type Group, type GroupMember, GroupMemberSchema, GroupSchema } from './schema';

const GroupList = z.array(GroupSchema);
const MemberList = z.array(GroupMemberSchema);

const groupPath = (groupId: string) => `/groups/${encodeURIComponent(groupId)}`;

/** The signed-in user's Groups, by name. */
export async function getGroups(): Promise<ActionResult<Group[]>> {
	return attempt(async () => GroupList.parse(await apiClient('/groups')));
}

/** At most 50 Groups per owner (`group.max_reached`). */
export async function createGroup(name: string): Promise<ActionResult<Group>> {
	return attempt(async () =>
		GroupSchema.parse(
			await apiClient('/groups', { method: 'POST', body: JSON.stringify({ name }) })
		)
	);
}

export async function renameGroup(groupId: string, name: string): Promise<ActionResult<Group>> {
	return attempt(async () =>
		GroupSchema.parse(
			await apiClient(groupPath(groupId), { method: 'PUT', body: JSON.stringify({ name }) })
		)
	);
}

/** Polls that invited the Group keep their Invitees. */
export async function deleteGroup(groupId: string): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient(groupPath(groupId), { method: 'DELETE' });
	});
}

export async function getGroupMembers(groupId: string): Promise<ActionResult<GroupMember[]>> {
	return attempt(async () => MemberList.parse(await apiClient(`${groupPath(groupId)}/members`)));
}

/**
 * Members already in the Group are ignored; nobody is notified. At most 100
 * members (`group.members.max`). Resolves to the full list.
 */
export async function addGroupMembers(
	groupId: string,
	members: { userIds: string[]; emails: string[] }
): Promise<ActionResult<GroupMember[]>> {
	return attempt(async () =>
		MemberList.parse(
			await apiClient(`${groupPath(groupId)}/members`, {
				method: 'POST',
				body: JSON.stringify(members),
			})
		)
	);
}

/** By user ID or by the email the member was added by. Resolves to the full list. */
export async function removeGroupMember(
	groupId: string,
	member: Pick<GroupMember, 'userId' | 'email'>
): Promise<ActionResult<GroupMember[]>> {
	const path = personPath(`${groupPath(groupId)}/members`, member);
	return attempt(async () => MemberList.parse(await apiClient(path, { method: 'DELETE' })));
}
