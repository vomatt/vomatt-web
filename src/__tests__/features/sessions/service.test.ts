import { getSessions, revokeOtherSessions, revokeSession } from '@/features/sessions/service';
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

describe('sessions service', () => {
	it('lists the signed-in devices', async () => {
		mockApiClient.mockResolvedValue([{ sessionId: 's1' }]);
		await expect(getSessions()).resolves.toEqual({ ok: true, data: [{ sessionId: 's1' }] });
		expect(mockApiClient.mock.calls[0][0]).toBe('/users/me/sessions');
	});

	it('signs out one by id and reports a missing one with its errorCode', async () => {
		mockApiClient.mockRejectedValue(new ApiError('Gone', 404, { errorCode: 'auth.session_not_found' }));
		await expect(revokeSession('s/1')).resolves.toMatchObject({
			ok: false,
			status: 404,
			errorCode: 'auth.session_not_found',
		});
		expect(mockApiClient).toHaveBeenCalledWith('/users/me/sessions/s%2F1', { method: 'DELETE' });
	});

	it('signs out every other device with scope=others', async () => {
		mockApiClient.mockResolvedValue(undefined);
		await expect(revokeOtherSessions()).resolves.toEqual({ ok: true, data: undefined });
		expect(mockApiClient).toHaveBeenCalledWith('/users/me/sessions?scope=others', { method: 'DELETE' });
	});
});
