/**
 * @jest-environment node
 */
import { ApiError, publicFetch } from '@/lib/api/client';
import { requestOtp, signout, verifyOtp } from '@/lib/api/services/auth';

jest.mock('@/lib/api/client', () => {
	const actual = jest.requireActual('@/lib/api/client');
	return { ...actual, publicFetch: jest.fn() };
});

jest.mock('@/lib/api/auth', () => ({
	clearAuthTokens: jest.fn(),
	setAuthTokens: jest.fn(),
	getTokens: jest.fn(),
}));

const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
	redirect: (...args: unknown[]) => mockRedirect(...args),
}));

const mockPublicFetch = publicFetch as jest.MockedFunction<typeof publicFetch>;
 
const authCookies = require('@/lib/api/auth') as Record<string, jest.Mock>;

beforeEach(() => {
	jest.clearAllMocks();
});

const bodyOf = (call: number) => JSON.parse(String(mockPublicFetch.mock.calls[call][1]?.body));

describe('requestOtp()', () => {
	it('normalises the email and sends a code', async () => {
		mockPublicFetch.mockResolvedValueOnce({ exists: true }).mockResolvedValueOnce({ success: true });

		const res = await requestOtp('  Alice@Example.com ');

		expect(mockPublicFetch.mock.calls[1][0]).toBe('/auth/send-otp');
		expect(bodyOf(1)).toEqual({ email: 'alice@example.com' });
		expect(res).toEqual({ status: 'SUCCESS', isNewUser: false });
	});

	it('reports a new email as a new user', async () => {
		mockPublicFetch.mockResolvedValueOnce({ exists: false }).mockResolvedValueOnce({ success: true });
		expect(await requestOtp('new@example.com')).toEqual({ status: 'SUCCESS', isNewUser: true });
	});

	it('maps the resend cooldown error', async () => {
		mockPublicFetch
			.mockResolvedValueOnce({ exists: true })
			.mockRejectedValueOnce(
				new ApiError('wait', 400, { errorCode: 'auth.otp.resend_cooldown' })
			);
		expect(await requestOtp('a@example.com')).toEqual({ status: 'ERROR', error: 'resendCooldown' });
	});

	it('maps rate limiting, without sending a code', async () => {
		mockPublicFetch.mockRejectedValueOnce(new ApiError('slow down', 429));
		expect(await requestOtp('a@example.com')).toEqual({ status: 'ERROR', error: 'rateLimited' });
		expect(mockPublicFetch).toHaveBeenCalledTimes(1);
	});
});

describe('verifyOtp()', () => {
	it('stores both tokens on success', async () => {
		mockPublicFetch.mockResolvedValueOnce({ token: 'a1', refreshToken: 'r1', user: {} });

		const res = await verifyOtp('a@example.com', '123456');

		expect(mockPublicFetch.mock.calls[0][0]).toBe('/auth/verify-otp');
		expect(bodyOf(0)).toEqual({ email: 'a@example.com', code: '123456' });
		expect(authCookies.setAuthTokens).toHaveBeenCalledWith({ accessToken: 'a1', refreshToken: 'r1' });
		expect(res).toEqual({ status: 'SUCCESS' });
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
