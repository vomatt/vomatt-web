import { reportProblem } from '@/features/feedback/service';
import { apiClient, ApiError, AuthError, publicFetch } from '@/lib/api/client';

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
	return { apiClient: jest.fn(), publicFetch: jest.fn(), ApiError, AuthError };
});

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;
const mockPublicFetch = publicFetch as jest.MockedFunction<typeof publicFetch>;

beforeEach(() => jest.resetAllMocks());

it('posts the message, signed in or not', async () => {
	mockApiClient.mockResolvedValue(undefined);
	expect(await reportProblem('Votes vanish')).toEqual({
		ok: true,
		data: undefined,
	});
	expect(mockApiClient).toHaveBeenCalledWith('/feedback', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message: 'Votes vanish' }),
		auth: 'optional',
	});
});

it('returns a failure instead of throwing', async () => {
	mockApiClient.mockRejectedValue(
		new ApiError('no', 400, { errorCode: 'common.validation' })
	);
	expect(await reportProblem('x')).toMatchObject({
		ok: false,
		status: 400,
		errorCode: 'common.validation',
	});
});

it('refuses an empty or oversized message without calling the API', async () => {
	expect(await reportProblem('   ')).toMatchObject({ ok: false });
	expect(await reportProblem('x'.repeat(2001))).toMatchObject({ ok: false });
	expect(await reportProblem(42 as unknown as string)).toMatchObject({
		ok: false,
	});
	expect(mockApiClient).not.toHaveBeenCalled();
});

it('sends signed out when the session is rejected', async () => {
	mockApiClient.mockRejectedValue(new AuthError('expired'));
	mockPublicFetch.mockResolvedValue(undefined);
	expect(await reportProblem('Votes vanish')).toEqual({
		ok: true,
		data: undefined,
	});
	expect(mockPublicFetch).toHaveBeenCalledWith('/feedback', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message: 'Votes vanish' }),
	});
});
