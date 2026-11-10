import { OFFICIAL_ROLES, type OfficialRole } from './schema';

export type OfficialAction =
	| 'publish' // post polls, comment, like
	| 'editOthers' // edit, end or delete others' polls and comments, manage invitees (EDITOR: own only)
	| 'editProfile' // the account's profile, avatar and visibility
	| 'manageMembers' // ADMIN never touches an OWNER
	| 'viewReport'
	| 'markRead'
	| 'leave';

/** The role matrix (design doc §4): who may do each action. */
const ALLOWED: Record<OfficialAction, readonly OfficialRole[]> = {
	publish: ['OWNER', 'ADMIN', 'CHIEF_EDITOR', 'EDITOR'],
	editOthers: ['OWNER', 'ADMIN', 'CHIEF_EDITOR'],
	editProfile: ['OWNER', 'ADMIN'],
	manageMembers: ['OWNER', 'ADMIN'],
	viewReport: ['OWNER', 'ADMIN', 'ANALYST'],
	markRead: ['OWNER', 'ADMIN', 'CHIEF_EDITOR', 'EDITOR', 'ANALYST'],
	leave: ['OWNER', 'ADMIN', 'CHIEF_EDITOR', 'EDITOR', 'ANALYST'],
};

export function can(role: OfficialRole, action: OfficialAction) {
	return ALLOWED[action].includes(role);
}

export type MemberAction = 'changeRole' | 'transferOwner' | 'remove' | 'leave';

/** What the viewer's ••• menu offers on a member's row; empty means no menu. */
export function memberActions(
	viewer: { userId: string; role: OfficialRole },
	member: { userId: string; role: OfficialRole }
): MemberAction[] {
	if (member.userId === viewer.userId) return ['leave'];
	if (!can(viewer.role, 'manageMembers')) return [];
	if (viewer.role !== 'OWNER' && member.role === 'OWNER') return [];
	return viewer.role === 'OWNER' && member.role !== 'OWNER'
		? ['changeRole', 'transferOwner', 'remove']
		: ['changeRole', 'remove'];
}

/** The roles the viewer may give: only an OWNER grants OWNER. */
export function grantableRoles(viewer: OfficialRole): readonly OfficialRole[] {
	return viewer === 'OWNER' ? OFFICIAL_ROLES : OFFICIAL_ROLES.filter((role) => role !== 'OWNER');
}
