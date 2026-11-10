import { COMMUNITY_ROLES, type CommunityRole } from './schema';

/** OWNER and ADMIN manage members; an ADMIN never touches an OWNER (design doc §4). */
export function canManageMembers(role: CommunityRole) {
	return role === 'OWNER' || role === 'ADMIN';
}

export type MemberAction = 'changeRole' | 'transferOwner' | 'remove' | 'leave';

/** What the viewer's ••• menu offers on a member's row; empty means no menu. */
export function memberActions(
	viewer: { userId: string; role: CommunityRole },
	member: { userId: string; role: CommunityRole }
): MemberAction[] {
	if (member.userId === viewer.userId) return ['leave'];
	if (!canManageMembers(viewer.role)) return [];
	if (viewer.role !== 'OWNER' && member.role === 'OWNER') return [];
	return viewer.role === 'OWNER' && member.role !== 'OWNER'
		? ['changeRole', 'transferOwner', 'remove']
		: ['changeRole', 'remove'];
}

/** The roles the viewer may give: only an OWNER grants OWNER. */
export function grantableRoles(viewer: CommunityRole): readonly CommunityRole[] {
	return viewer === 'OWNER' ? COMMUNITY_ROLES : COMMUNITY_ROLES.filter((role) => role !== 'OWNER');
}
