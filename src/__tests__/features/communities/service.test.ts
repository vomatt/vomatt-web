jest.unmock('@/features/communities/service');

import { refresh } from 'next/cache';

import {
	acceptCommunityInvitation,
	createCommunity,
	declineCommunityInvitation,
	inviteMember,
	listInvitations,
	revokeInvitation,
} from '@/features/communities/service';
import { apiClient } from '@/lib/api/client';

jest.mock('@/lib/api/auth', () => ({ getActingCommunityId: jest.fn() }));
jest.mock('next/cache', () => ({ refresh: jest.fn(), updateTag: jest.fn() }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));
jest.mock('@/lib/api/client', () => {
	class ApiError extends Error {}
	class AuthError extends Error {}
	return { apiClient: jest.fn(), ApiError, AuthError };
});

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => jest.resetAllMocks());

describe('invitations', () => {
	const invitation = { id: 'i1', userId: 'u1', username: 'cindy', role: 'EDITOR', invitedAt: 'a', expiresAt: 'b' };

	it('invites by id or by address, never by both', async () => {
		mockApiClient.mockResolvedValue(invitation);
		await inviteMember('c1', { userId: 'u1' }, 'EDITOR');
		expect(mockApiClient).toHaveBeenLastCalledWith('/communities/c1/invitations', {
			method: 'POST',
			body: JSON.stringify({ userId: 'u1', role: 'EDITOR' }),
		});
		await inviteMember('c1', { email: 'a@b.co' }, 'ADMIN');
		expect(mockApiClient).toHaveBeenLastCalledWith('/communities/c1/invitations', {
			method: 'POST',
			body: JSON.stringify({ email: 'a@b.co', role: 'ADMIN' }),
		});
	});

	it('lists and revokes', async () => {
		mockApiClient.mockResolvedValue([invitation]);
		expect(await listInvitations('c1')).toEqual({ ok: true, data: [invitation] });
		mockApiClient.mockResolvedValue(undefined);
		await revokeInvitation('c1', 'i1');
		expect(mockApiClient).toHaveBeenLastCalledWith('/communities/c1/invitations/i1', { method: 'DELETE' });
	});

	it('accepts as the person and refreshes the layout; declines as the person', async () => {
		mockApiClient.mockResolvedValue({ communityId: 'c1', username: 'sunrise', role: 'EDITOR' });
		expect((await acceptCommunityInvitation('i1')).ok).toBe(true);
		expect(mockApiClient).toHaveBeenLastCalledWith('/community-invitations/i1/accept', { method: 'POST', actAs: false });
		expect(refresh).toHaveBeenCalled();
		mockApiClient.mockResolvedValue(undefined);
		await declineCommunityInvitation('i1');
		expect(mockApiClient).toHaveBeenLastCalledWith('/community-invitations/i1/decline', { method: 'POST', actAs: false });
	});
});

describe('createCommunity', () => {
	it('creates the account as the person, even while acting, and refreshes the layout', async () => {
		mockApiClient.mockResolvedValue({ id: 'c1', username: 'sunrise' });

		expect(await createCommunity('sunrise', 'Sunrise')).toEqual({ ok: true, data: { id: 'c1', username: 'sunrise' } });
		expect(mockApiClient).toHaveBeenCalledWith('/communities', {
			method: 'POST',
			body: JSON.stringify({ username: 'sunrise', displayName: 'Sunrise' }),
			actAs: false,
		});
		expect(refresh).toHaveBeenCalled();
	});

	it('leaves the page as it is when the API refuses', async () => {
		mockApiClient.mockRejectedValue(new Error('refused'));

		expect((await createCommunity('sunrise', 'Sunrise')).ok).toBe(false);
		expect(refresh).not.toHaveBeenCalled();
	});
});
