/** Keys under `authError.*` in the locale files. */
export type AuthErrorKey =
	| 'invalidCode'
	| 'codeExpired'
	| 'tooManyAttempts'
	| 'resendCooldown'
	| 'emailSendFailed'
	| 'accountSuspended'
	| 'rateLimited'
	| 'invalidEmail'
	| 'serverError';

const ERROR_CODES: Record<string, AuthErrorKey> = {
	'auth.invalid_otp': 'invalidCode',
	'auth.otp.invalid_or_expired': 'codeExpired',
	'auth.otp.expired': 'codeExpired',
	'auth.otp.too_many_attempts': 'tooManyAttempts',
	'auth.otp.resend_cooldown': 'resendCooldown',
	'auth.email.send_failed': 'emailSendFailed',
	'auth.account_banned': 'accountSuspended',
};

/** Maps a backend `errorCode` and HTTP status to a message the UI can show. */
export function toAuthErrorKey(errorCode: string | undefined, status?: number): AuthErrorKey {
	if (errorCode && ERROR_CODES[errorCode]) return ERROR_CODES[errorCode];
	if (status === 429) return 'rateLimited';
	if (status === 400) return 'invalidEmail';
	return 'serverError';
}
