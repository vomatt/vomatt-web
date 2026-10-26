jest.unmock('@/features/follows/service');

import { followUser, getFollowedUsers, getFollowers, getFollowing, unfollowUser } from '@/features/follows/service';
import { apiClient, ApiError } from '@/lib/api/client';

jest.mock('@/lib/api/auth', () => ({ clearAuthTokens: jest.fn() }));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn(), updateTag: jest.fn() }));
jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));
jest.mock('@/lib/api/client', () => {
	class ApiError extends Error {
		constructor(
			message: string,
			public statusCode: number,
			public data?: any
		) {
			super(message);
		}
	}
	class AuthError extends Error {}
	return { apiClient: jest.fn(), ApiError, AuthError };
});

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => jest.resetAllMocks());

it('lists followed users with a cursor', async () => {
	mockApiClient.mockResolvedValue({ items: [{ id: 'u1', username: 'bob' }], nextCursor: 'c2' });
	const result = await getFollowedUsers('c1');
	expect(mockApiClient).toHaveBeenCalledWith('/users/me/follows?limit=20&cursor=c1');
	expect(result).toEqual({ ok: true, data: { items: [{ id: 'u1', username: 'bob' }], nextCursor: 'c2' } });
});

it('follows and unfollows by user ID', async () => {
	mockApiClient.mockResolvedValue(undefined);
	expect(await followUser('u1')).toEqual({ ok: true, data: undefined });
	expect(mockApiClient).toHaveBeenCalledWith('/users/me/follows/u1', { method: 'POST' });
	expect(await unfollowUser('u1')).toEqual({ ok: true, data: undefined });
	expect(mockApiClient).toHaveBeenCalledWith('/users/me/follows/u1', { method: 'DELETE' });
});

it('returns the errorCode of a refused follow', async () => {
	mockApiClient.mockRejectedValue(new ApiError('no', 400, { errorCode: 'user.follow.self' }));
	expect(await followUser('me')).toMatchObject({ ok: false, status: 400, errorCode: 'user.follow.self' });
});

it('returns the errorCode of a follow of a blocked user', async () => {
	mockApiClient.mockRejectedValue(new ApiError('no', 400, { errorCode: 'user.follow.blocked' }));
	expect(await followUser('u1')).toMatchObject({ ok: false, status: 400, errorCode: 'user.follow.blocked' });
});

it('lists a user’s followers and following with a cursor', async () => {
	mockApiClient.mockResolvedValue({ items: [{ id: 'u1', username: 'bob' }], nextCursor: null });
	expect(await getFollowers('al ice', 'c1')).toEqual({
		ok: true,
		data: { items: [{ id: 'u1', username: 'bob' }], nextCursor: null },
	});
	expect(mockApiClient).toHaveBeenCalledWith('/users/al%20ice/followers?limit=20&cursor=c1');
	await getFollowing('alice');
	expect(mockApiClient).toHaveBeenLastCalledWith('/users/alice/following?limit=20');
});

it('returns the errorCode of a list for an unknown user', async () => {
	mockApiClient.mockRejectedValue(new ApiError('no', 404, { errorCode: 'user.not_found' }));
	expect(await getFollowers('ghost')).toMatchObject({ ok: false, status: 404, errorCode: 'user.not_found' });
});
