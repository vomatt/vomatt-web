import type { InviteesInput } from './schema';

export type PickedUser = { id: string; username: string; avatarUrl?: string | null };
type PickedGroup = { id: string; name: string; memberCount: number };

/** People picked by username or email, and Groups whose members are copied in. */
export type InviteeSelection = { users: PickedUser[]; emails: string[]; groups: PickedGroup[] };

export const EMPTY_INVITEES: InviteeSelection = { users: [], emails: [], groups: [] };

export function isSelectionEmpty(selection: InviteeSelection) {
	return !selection.users.length && !selection.emails.length && !selection.groups.length;
}

/** An Invitee or Group member: added by user ID, or by an email address. */
export type Person = {
	userId: string | null;
	username: string | null;
	avatarUrl?: string | null;
	/** Only for Invitees, as their visibility settings allow */
	displayName?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email: string | null;
};

/** Unique within one list: an email is listed only by that address, even once tied to a user. */
export function personKey(person: Pick<Person, 'userId' | 'email'>) {
	return person.email ?? person.userId ?? '';
}

/**
 * The user IDs among `people` (an email-only person has none), for leaving them out of a search.
 * Null while the list loads; an empty list once it failed, so search still works.
 */
export function userIdsOf(people: readonly Pick<Person, 'userId'>[] | null, loadFailed: boolean) {
	if (!people) return loadFailed ? [] : null;
	return people.flatMap((person) => (person.userId ? [person.userId] : []));
}

/** The API path of one Invitee or member under `base`: by `?email=`, or by user ID. */
export function personPath(base: string, person: Pick<Person, 'userId' | 'email'>) {
	return person.email
		? `${base}?${new URLSearchParams({ email: person.email })}`
		: `${base}/${encodeURIComponent(person.userId ?? '')}`;
}

export function selectionToInput(selection: InviteeSelection): InviteesInput {
	return {
		userIds: selection.users.map((user) => user.id),
		emails: selection.emails,
		inviteListIds: selection.groups.map((group) => group.id),
	};
}
