import { AuthError } from '@/lib/api/client';
import { sendPhoneBindOtp, verifyPhoneBind } from '@/lib/api/services/users';

jest.mock('next/cache', () => ({ updateTag: jest.fn(), revalidateTag: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn(), unstable_rethrow: jest.fn() }));
jest.mock('@/lib/api/auth', () => ({ clearAuthTokens: jest.fn() }));
jest.mock('@/lib/api/client', () => {
	class AuthError extends Error {
		constructor(
			message: string,
			public statusCode = 401,
			public errorCode?: string
		) {
			super(message);
		}
	}
	class ApiError extends Error {
		constructor(
			message: string,
			public statusCode: number,
			public data?: { errorCode?: string }
		) {
			super(message);
		}
	}
	return { apiClient: jest.fn(), publicFetch: jest.fn(), AuthError, ApiError };
});

const { apiClient, ApiError } = jest.requireMock('@/lib/api/client');
const { clearAuthTokens } = jest.requireMock('@/lib/api/auth');

beforeEach(() => jest.clearAllMocks());

describe('phone binding actions', () => {
	it('posts the number for a code', async () => {
		apiClient.mockResolvedValue(null);
		await expect(sendPhoneBindOtp('0912345678')).resolves.toEqual({ ok: true, data: undefined });
		expect(apiClient).toHaveBeenCalledWith('/users/me/phone/send-otp', {
			method: 'POST',
			body: JSON.stringify({ phone: '0912345678' }),
		});
	});

	it('returns the updated profile once verified', async () => {
		apiClient.mockResolvedValue({ phoneNumber: '+886912345678', phoneVerified: true });
		await expect(verifyPhoneBind('0912345678', '123456')).resolves.toEqual({
			ok: true,
			data: { phoneNumber: '+886912345678', phoneVerified: true },
		});
	});

	it.each(['auth.invalid_otp', 'auth.otp.invalid_or_expired', 'auth.otp.too_many_attempts'])(
		'returns a wrong-code 401 (%s) to the form instead of ending the session',
		async (errorCode) => {
			apiClient.mockRejectedValue(new AuthError('Your session has expired.', 401, errorCode));
			await expect(verifyPhoneBind('0912345678', '000000')).resolves.toMatchObject({ ok: false, status: 401, errorCode });
			expect(clearAuthTokens).not.toHaveBeenCalled();
		}
	);

	it('returns a number taken by another account as its errorCode', async () => {
		apiClient.mockRejectedValue(new ApiError('Phone number already in use', 409, { errorCode: 'user.phone.taken' }));
		await expect(verifyPhoneBind('0912345678', '123456')).resolves.toMatchObject({ ok: false, status: 409, errorCode: 'user.phone.taken' });
	});
});
