import { apiClient } from '@/lib/api/client';

import {
	forceExpireToken,
	resendVerification,
	signout,
} from '@/lib/api/services/auth';

jest.mock('@/lib/api/client', () => ({
	apiClient: jest.fn(),
}));

jest.mock('@/lib/api/auth', () => ({
	clearAuthTokens: jest.fn(),
	setAuthTokens: jest.fn(),
	getTokens: jest.fn(),
	refreshTokens: jest.fn(),
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockClearAuthTokens = require('@/lib/api/auth')
	.clearAuthTokens as jest.Mock;

beforeEach(() => {
	mockApiClient.mockClear();
	mockApiClient.mockResolvedValue(undefined);
	mockClearAuthTokens.mockClear();
	mockClearAuthTokens.mockResolvedValue(undefined);
});

describe('signout()', () => {
	it('calls POST /api/auth/signout', async () => {
		await signout();
		expect(mockApiClient).toHaveBeenCalledWith('/api/v1/auth/signout', {
			method: 'POST',
		});
	});

	it('calls clearAuthTokens after signout', async () => {
		await signout();
		expect(mockClearAuthTokens).toHaveBeenCalled();
	});
});

describe('resendVerification()', () => {
	it('calls POST /api/v1/auth/resend-verification with email in body', async () => {
		await resendVerification('user@example.com');
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/auth/resend-verification',
			{ method: 'POST', body: JSON.stringify({ email: 'user@example.com' }) }
		);
	});
});

describe('forceExpireToken()', () => {
	it('calls POST /api/auth/force-expire-token', async () => {
		await forceExpireToken();
		expect(mockApiClient).toHaveBeenCalledWith(
			'/api/v1/auth/force-expire-token',
			{ method: 'POST' }
		);
	});
});
