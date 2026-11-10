/**
 * @jest-environment node
 */
jest.unmock('@/features/communities/acting');

import { actAsCommunity } from '@/features/communities/acting';
import { listMyCommunities } from '@/features/communities/service';

const mockSet = jest.fn();
const mockDelete = jest.fn();
jest.mock('next/headers', () => ({ cookies: async () => ({ set: mockSet, delete: mockDelete }) }));
jest.mock('@/features/communities/service', () => ({ listMyCommunities: jest.fn() }));
// Keeps the auth stack (jose) out: only the cookie flags are needed from it
jest.mock('@/lib/api/tokens', () => ({
	AUTH_COOKIE_BASE: { httpOnly: true, secure: false, sameSite: 'lax', path: '/' },
}));

const list = listMyCommunities as jest.Mock;
const community = (role: string) => ({ communityId: 'c1', username: 'tower', displayName: null, avatarUrl: null, role });

beforeEach(() => jest.clearAllMocks());

describe('actAsCommunity', () => {
	it('sets an httpOnly cookie for a member who can act as the account', async () => {
		list.mockResolvedValue({ ok: true, data: [community('EDITOR')] });

		await expect(actAsCommunity('c1')).resolves.toEqual({ ok: true, data: undefined });
		expect(mockSet).toHaveBeenCalledWith('actAs', 'c1', expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }));
	});

	it('refuses an account the user is not a member of', async () => {
		list.mockResolvedValue({ ok: true, data: [] });

		await expect(actAsCommunity('c1')).resolves.toMatchObject({ ok: false, errorCode: 'community.not_member' });
		expect(mockSet).not.toHaveBeenCalled();
	});

	it('refuses an analyst, who has nothing to do as the account yet', async () => {
		list.mockResolvedValue({ ok: true, data: [community('ANALYST')] });

		await expect(actAsCommunity('c1')).resolves.toMatchObject({ ok: false });
		expect(mockSet).not.toHaveBeenCalled();
	});

	it('passes on a failure to load the list without setting anything', async () => {
		list.mockResolvedValue({ ok: false, message: 'down' });

		await expect(actAsCommunity('c1')).resolves.toEqual({ ok: false, message: 'down' });
		expect(mockSet).not.toHaveBeenCalled();
	});

	it('goes back to the user with null', async () => {
		await expect(actAsCommunity(null)).resolves.toEqual({ ok: true, data: undefined });
		expect(mockDelete).toHaveBeenCalledWith('actAs');
		expect(list).not.toHaveBeenCalled();
	});
});
