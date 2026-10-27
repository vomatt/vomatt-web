/**
 * @jest-environment node
 */
import { apiClient, ApiError, publicFetch } from '@/lib/api/client';
import {
	getPasskeyRegistrationOptions,
	requestOtp,
	signout,
	verifyOtp,
	verifyPasskeyRegistration,
} from '@/lib/api/services/auth';

jest.mock('@/lib/api/client', () => {
	const actual = jest.requireActual('@/lib/api/client');
	return { ...actual, apiClient: jest.fn(), publicFetch: jest.fn() };
});

jest.mock('@/lib/api/auth', () => ({
	clearAuthTokens: jest.fn(),
	setAuthTokens: jest.fn(),
	getTokens: jest.fn(),
}));

let mockRequestHeaders = new Headers();
jest.mock('next/headers', () => ({ headers: async () => mockRequestHeaders }));

const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
	redirect: (...args: unknown[]) => mockRedirect(...args),
	unstable_rethrow: jest.fn(),
}));

const mockPublicFetch = publicFetch as jest.MockedFunction<typeof publicFetch>;
const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;
 
const authCookies = require('@/lib/api/auth') as Record<string, jest.Mock>;

beforeEach(() => {
	jest.clearAllMocks();
	mockRequestHeaders = new Headers();
	delete process.env.CLIENT_IP_SECRET;
});

const bodyOf = (call: number) => JSON.parse(String(mockPublicFetch.mock.calls[call][1]?.body));

describe('requestOtp()', () => {
	it("passes the user's IP, which the OTP limits and lockouts are keyed on", async () => {
		process.env.CLIENT_IP_SECRET = 'client-ip-secret-0123456789abcdef';
		mockRequestHeaders = new Headers({ 'x-forwarded-for': '198.51.100.9' });
		mockPublicFetch.mockResolvedValueOnce({ success: true });

		await requestOtp('alice@example.com');

		expect(mockPublicFetch.mock.calls[0][1]?.headers).toMatchObject({ 'X-Client-IP': '198.51.100.9' });
	});

	it('normalises the email and sends a code', async () => {
		mockPublicFetch.mockResolvedValueOnce({ success: true });

		const res = await requestOtp('  Alice@Example.com ');

		expect(mockPublicFetch.mock.calls[0][0]).toBe('/auth/send-otp');
		expect(bodyOf(0)).toEqual({ email: 'alice@example.com' });
		expect(res).toEqual({ status: 'SUCCESS' });
	});

	it('maps the resend cooldown error', async () => {
		mockPublicFetch.mockRejectedValueOnce(
			new ApiError('wait', 400, { errorCode: 'auth.otp.resend_cooldown' })
		);
		expect(await requestOtp('a@example.com')).toEqual({ status: 'ERROR', error: 'resendCooldown' });
	});

	it('maps rate limiting, without sending a code', async () => {
		mockPublicFetch.mockRejectedValueOnce(new ApiError('slow down', 429));
		expect(await requestOtp('a@example.com')).toEqual({ status: 'ERROR', error: 'rateLimited' });
		expect(mockPublicFetch).toHaveBeenCalledTimes(1);
	});

	it('maps the daily send limit to its own copy', async () => {
		mockPublicFetch.mockRejectedValueOnce(new ApiError('limit', 429, { errorCode: 'auth.otp.daily_limit' }));
		expect(await requestOtp('a@example.com')).toEqual({
			status: 'ERROR',
			error: 'apiError.auth.otp.daily_limit',
		});
	});
});

describe('verifyOtp()', () => {
	it('stores both tokens on success', async () => {
		mockPublicFetch.mockResolvedValueOnce({ token: 'a1', refreshToken: 'r1', user: {} });

		const res = await verifyOtp('a@example.com', '123456');

		expect(mockPublicFetch.mock.calls[0][0]).toBe('/auth/verify-otp');
		expect(bodyOf(0)).toEqual({ email: 'a@example.com', code: '123456' });
		expect(authCookies.setAuthTokens).toHaveBeenCalledWith({ accessToken: 'a1', refreshToken: 'r1' });
		expect(res).toEqual({ status: 'SUCCESS', isNewUser: false });
	});

	it('reports an account created by this sign-in', async () => {
		mockPublicFetch.mockResolvedValueOnce({ token: 'a1', refreshToken: 'r1', isNewUser: true, user: {} });
		expect(await verifyOtp('new@example.com', '123456')).toEqual({ status: 'SUCCESS', isNewUser: true });
	});

	it('maps a wrong code without storing tokens', async () => {
		mockPublicFetch.mockRejectedValueOnce(
			new ApiError('wrong', 401, { errorCode: 'auth.invalid_otp' })
		);

		expect(await verifyOtp('a@example.com', '000000')).toEqual({
			status: 'ERROR',
			error: 'invalidCode',
		});
		expect(authCookies.setAuthTokens).not.toHaveBeenCalled();
	});

	it('maps too many attempts', async () => {
		mockPublicFetch.mockRejectedValueOnce(
			new ApiError('locked', 401, { errorCode: 'auth.otp.too_many_attempts' })
		);
		expect(await verifyOtp('a@example.com', '000000')).toMatchObject({ error: 'tooManyAttempts' });
	});
});

describe('signout()', () => {
	it('revokes the refresh token on the backend, then clears cookies', async () => {
		authCookies.getTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		mockPublicFetch.mockResolvedValueOnce({ success: true });

		await signout();

		expect(mockPublicFetch.mock.calls[0][0]).toBe('/auth/logout');
		expect(bodyOf(0)).toEqual({ refreshToken: 'r1' });
		expect(authCookies.clearAuthTokens).toHaveBeenCalled();
		expect(mockRedirect).toHaveBeenCalledWith('/');
	});

	it('still clears cookies when the backend is down', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		authCookies.getTokens.mockResolvedValue({ accessToken: '', refreshToken: 'r1' });
		mockPublicFetch.mockRejectedValueOnce(new Error('down'));

		await signout();

		expect(authCookies.clearAuthTokens).toHaveBeenCalled();
	});
});

describe('passkey registration', () => {
	it('asks the API for creation options as the signed-in user', async () => {
		mockApiClient.mockResolvedValue({ challenge: 'abc' });
		await expect(getPasskeyRegistrationOptions()).resolves.toEqual({ ok: true, data: { challenge: 'abc' } });
		expect(mockApiClient).toHaveBeenCalledWith('/auth/passkey/register/options', expect.objectContaining({ method: 'POST' }));
	});

	it('sends the credential JSON and the optional name to verify', async () => {
		const credential = { id: 'c1', rawId: 'c1', type: 'public-key' } as unknown as PublicKeyCredentialJSON;
		mockApiClient.mockResolvedValue({ id: 'p1' });
		await verifyPasskeyRegistration(credential, 'iPhone');
		const [endpoint, init] = mockApiClient.mock.calls[0];
		expect(endpoint).toBe('/auth/passkey/register/verify');
		expect(init?.method).toBe('POST');
		expect(JSON.parse(String(init?.body))).toEqual({ credential, name: 'iPhone' });
	});

	it('returns the errorCode of a failed verify instead of throwing', async () => {
		mockApiClient.mockRejectedValue(new ApiError('bad', 400, { errorCode: 'auth.passkey.invalid' }));
		await expect(verifyPasskeyRegistration({} as PublicKeyCredentialJSON)).resolves.toMatchObject({
			ok: false,
			status: 400,
			errorCode: 'auth.passkey.invalid',
		});
	});
});
