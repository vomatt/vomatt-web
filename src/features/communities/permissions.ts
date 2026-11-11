import { type CommunityRole, OFFERED_ROLES } from './schema';

/** OWNER and ADMIN manage members; an ADMIN never touches an OWNER (design doc §4). */
export function canManageMembers(role: CommunityRole) {
	return role === 'OWNER' || role === 'ADMIN';
}

export function canEditProfile(role: CommunityRole) {
	return role === 'OWNER' || role === 'ADMIN';
}

export function canDelete(role: CommunityRole) {
	return role === 'OWNER';
}

export type MemberAction = 'changeRole' | 'transferOwner' | 'remove' | 'leave';

// What a locked account still allows besides deleting it: an owner with room can take it over, and anyone can leave
const LOCKED_ACTIONS: MemberAction[] = ['transferOwner', 'leave'];

/** What the viewer's ••• menu offers on a member's row; empty means no menu. */
export function memberActions(
	viewer: { userId: string; role: CommunityRole },
	member: { userId: string; role: CommunityRole },
	locked = false
): MemberAction[] {
	const actions = roleActions(viewer, member);
	return locked ? actions.filter((action) => LOCKED_ACTIONS.includes(action)) : actions;
}

function roleActions(viewer: { userId: string; role: CommunityRole }, member: { userId: string; role: CommunityRole }): MemberAction[] {
	if (member.userId === viewer.userId) return ['leave'];
	if (!canManageMembers(viewer.role)) return [];
	if (viewer.role !== 'OWNER' && member.role === 'OWNER') return [];
	return viewer.role === 'OWNER' && member.role !== 'OWNER'
		? ['changeRole', 'transferOwner', 'remove']
		: ['changeRole', 'remove'];
}

/** The roles the viewer may give: only an OWNER grants OWNER. */
export function grantableRoles(viewer: CommunityRole): readonly CommunityRole[] {
	return viewer === 'OWNER' ? OFFERED_ROLES : OFFERED_ROLES.filter((role) => role !== 'OWNER');
}
