import { deletePasskey, getPasskeys } from '@/features/passkeys/service';
import { apiClient, ApiError } from '@/lib/api/client';

jest.mock('next/navigation', () => ({ unstable_rethrow: jest.fn() }));
jest.mock('@/lib/api/client', () => ({
	apiClient: jest.fn(),
	ApiError: class ApiError extends Error {
		constructor(
			message: string,
			public statusCode: number,
			public data?: any
		) {
			super(message);
		}
	},
	AuthError: class AuthError extends Error {},
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => mockApiClient.mockReset());

describe('passkey service', () => {
	it('lists the signed-in user’s passkeys', async () => {
		mockApiClient.mockResolvedValue([{ id: 'p1' }]);
		await expect(getPasskeys()).resolves.toEqual({ ok: true, data: [{ id: 'p1' }] });
		expect(mockApiClient.mock.calls[0][0]).toBe('/users/me/passkeys');
	});

	it('deletes one by id and reports a refusal with its errorCode', async () => {
		mockApiClient.mockRejectedValue(new ApiError('Not found', 404, { errorCode: 'common.not_found' }));
		await expect(deletePasskey('p1')).resolves.toMatchObject({ ok: false, status: 404, errorCode: 'common.not_found' });
		expect(mockApiClient).toHaveBeenCalledWith('/users/me/passkeys/p1', { method: 'DELETE' });
	});
});
