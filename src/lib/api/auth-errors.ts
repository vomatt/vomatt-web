import en from '@/locales/en.json';

/** Keys under `authError.*` in the locale files, or a full `apiError.auth.*` key. */
export type AuthErrorKey =
	| `apiError.auth.${string}`
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

/** An `auth.*` code with `apiError` copy that needs no `{0}` value. */
function hasApiErrorCopy(errorCode: string) {
	const text = errorCode.split('.').reduce<unknown>(
		(node, part) => (node as Record<string, unknown> | undefined)?.[part],
		en.apiError
	);
	return typeof text === 'string' && !/\{\d+\}/.test(text);
}

/** Maps a backend `errorCode` and HTTP status to a message the UI can show. */
export function toAuthErrorKey(errorCode: string | undefined, status?: number): AuthErrorKey {
	if (errorCode && ERROR_CODES[errorCode]) return ERROR_CODES[errorCode];
	if (errorCode?.startsWith('auth.') && hasApiErrorCopy(errorCode)) return `apiError.${errorCode}` as AuthErrorKey;
	if (status === 429) return 'rateLimited';
	if (status === 400) return 'invalidEmail';
	return 'serverError';
}
