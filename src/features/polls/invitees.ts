import type { InviteesInput } from './schema';

export type PickedUser = { id: string; username: string };
export type PickedGroup = { id: string; name: string; memberCount: number };

/** People picked by username or email, and Groups whose members are copied in. */
export type InviteeSelection = { users: PickedUser[]; emails: string[]; groups: PickedGroup[] };

export const EMPTY_INVITEES: InviteeSelection = { users: [], emails: [], groups: [] };

export function isSelectionEmpty(selection: InviteeSelection) {
	return !selection.users.length && !selection.emails.length && !selection.groups.length;
}

export function selectionToInput(selection: InviteeSelection): InviteesInput {
	return {
		userIds: selection.users.map((user) => user.id),
		emails: selection.emails,
		groupIds: selection.groups.map((group) => group.id),
	};
}
