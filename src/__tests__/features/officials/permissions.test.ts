import { canManageMembers, grantableRoles, memberActions } from '@/features/officials/permissions';
import { OFFICIAL_ROLES } from '@/features/officials/schema';

describe('canManageMembers', () => {
	it('lets only OWNER and ADMIN manage members', () => {
		expect(OFFICIAL_ROLES.filter(canManageMembers)).toEqual(['OWNER', 'ADMIN']);
	});
});

describe('memberActions', () => {
	const owner = { userId: 'o', role: 'OWNER' as const };
	const admin = { userId: 'a', role: 'ADMIN' as const };

	it('offers only Leave on the viewer’s own row', () => {
		expect(memberActions(owner, owner)).toEqual(['leave']);
		expect(memberActions({ userId: 'x', role: 'ANALYST' }, { userId: 'x', role: 'ANALYST' })).toEqual(['leave']);
	});

	it('lets an OWNER change, hand ownership to and remove others', () => {
		expect(memberActions(owner, { userId: 'e', role: 'EDITOR' })).toEqual(['changeRole', 'transferOwner', 'remove']);
		// Already an owner: nothing to hand over
		expect(memberActions(owner, { userId: 'o2', role: 'OWNER' })).toEqual(['changeRole', 'remove']);
	});

	it('gives an ADMIN no menu on OWNER rows and no transfer', () => {
		expect(memberActions(admin, owner)).toEqual([]);
		expect(memberActions(admin, { userId: 'e', role: 'EDITOR' })).toEqual(['changeRole', 'remove']);
	});

	it.each(['CHIEF_EDITOR', 'EDITOR', 'ANALYST'] as const)('gives a %s no menu on others', (role) => {
		expect(memberActions({ userId: 'v', role }, { userId: 'e', role: 'EDITOR' })).toEqual([]);
	});
});

describe('grantableRoles', () => {
	it('lets only an OWNER grant OWNER', () => {
		expect(grantableRoles('OWNER')).toContain('OWNER');
		expect(grantableRoles('ADMIN')).toEqual(['ADMIN', 'CHIEF_EDITOR', 'EDITOR', 'ANALYST']);
	});
});
