import { cooldownSeconds, toAuthErrorKey } from '@/lib/api/auth-errors';

describe('toAuthErrorKey', () => {
	it('keeps the auth copy for a mapped code', () => {
		expect(toAuthErrorKey('auth.invalid_otp', 401)).toBe('invalidCode');
	});

	it("says an official account can't sign in itself", () => {
		expect(toAuthErrorKey('auth.official_sign_in_not_allowed', 403)).toBe('officialSignIn');
	});

	it('uses the apiError copy for an unmapped auth code', () => {
		expect(toAuthErrorKey('auth.identifier.required', 400)).toBe('apiError.auth.identifier.required');
	});

	it('falls back by status for an auth code whose copy needs a value, a 400 to the caller\'s copy', () => {
		expect(toAuthErrorKey('auth.email.send_failed_reason', 400, { badRequest: 'invalidEmail' })).toBe('invalidEmail');
		expect(toAuthErrorKey(undefined, 400)).toBe('serverError');
		expect(toAuthErrorKey(undefined, 429)).toBe('rateLimited');
	});

	it('maps codes that read the same wherever they come', () => {
		expect(toAuthErrorKey('auth.sms.send_failed', 400)).toBe('smsSendFailed');
		expect(toAuthErrorKey('user.phone.taken', 409)).toBe('phoneTaken');
	});
});

describe('cooldownSeconds', () => {
	it('reads the seconds left from a resend cooldown message', () => {
		expect(cooldownSeconds('auth.otp.resend_cooldown', 'Please wait 42 seconds before resending')).toBe(42);
	});

	it('is undefined for any other code', () => {
		expect(cooldownSeconds('auth.otp.daily_limit', 'Wait 42 seconds')).toBeUndefined();
	});
});
