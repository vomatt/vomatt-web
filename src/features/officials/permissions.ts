import { OFFICIAL_ROLES, type OfficialRole } from './schema';

/** OWNER and ADMIN manage members; an ADMIN never touches an OWNER (design doc §4). */
export function canManageMembers(role: OfficialRole) {
	return role === 'OWNER' || role === 'ADMIN';
}

export type MemberAction = 'changeRole' | 'transferOwner' | 'remove' | 'leave';

/** What the viewer's ••• menu offers on a member's row; empty means no menu. */
export function memberActions(
	viewer: { userId: string; role: OfficialRole },
	member: { userId: string; role: OfficialRole }
): MemberAction[] {
	if (member.userId === viewer.userId) return ['leave'];
	if (!canManageMembers(viewer.role)) return [];
	if (viewer.role !== 'OWNER' && member.role === 'OWNER') return [];
	return viewer.role === 'OWNER' && member.role !== 'OWNER'
		? ['changeRole', 'transferOwner', 'remove']
		: ['changeRole', 'remove'];
}

/** The roles the viewer may give: only an OWNER grants OWNER. */
export function grantableRoles(viewer: OfficialRole): readonly OfficialRole[] {
	return viewer === 'OWNER' ? OFFICIAL_ROLES : OFFICIAL_ROLES.filter((role) => role !== 'OWNER');
}
