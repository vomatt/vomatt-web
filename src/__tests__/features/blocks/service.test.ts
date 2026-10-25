import { blockUser,getBlockedUsers, unblockUser } from '@/features/blocks/service';
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

it('lists blocked users with a cursor', async () => {
	mockApiClient.mockResolvedValue({ items: [{ id: 'u1', username: 'bob' }], nextCursor: 'c2' });
	const result = await getBlockedUsers('c1');
	expect(mockApiClient).toHaveBeenCalledWith('/users/me/blocks?limit=20&cursor=c1');
	expect(result).toEqual({ ok: true, data: { items: [{ id: 'u1', username: 'bob' }], nextCursor: 'c2' } });
});

it('blocks and unblocks by user ID', async () => {
	mockApiClient.mockResolvedValue(undefined);
	expect(await blockUser('u1')).toEqual({ ok: true, data: undefined });
	expect(mockApiClient).toHaveBeenCalledWith('/users/me/blocks/u1', { method: 'POST' });
	expect(await unblockUser('u1')).toEqual({ ok: true, data: undefined });
	expect(mockApiClient).toHaveBeenCalledWith('/users/me/blocks/u1', { method: 'DELETE' });
});

it('returns the errorCode of a refused block', async () => {
	mockApiClient.mockRejectedValue(new ApiError('no', 400, { errorCode: 'user.block.self' }));
	expect(await blockUser('me')).toMatchObject({ ok: false, status: 400, errorCode: 'user.block.self' });
});
