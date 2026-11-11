jest.unmock('@/features/communities/service');

import { refresh } from 'next/cache';

import { createCommunity } from '@/features/communities/service';
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
