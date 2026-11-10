import en from '@/locales/en.json';

/** Keys under `authError.*` in the locale files, or a full `apiError.auth.*` key. */
export type AuthErrorKey =
	| `apiError.auth.${string}`
	| 'invalidCode'
	| 'invalidSmsCode'
	| 'codeExpired'
	| 'tooManyAttempts'
	| 'resendCooldown'
	| 'emailSendFailed'
	| 'accountSuspended'
	| 'rateLimited'
	| 'invalidEmail'
	| 'phoneTaken'
	| 'smsSendFailed'
	| 'passkeyRefused'
	| 'serverError';

const ERROR_CODES: Record<string, AuthErrorKey> = {
	'auth.invalid_otp': 'invalidCode',
	'auth.otp.invalid_or_expired': 'codeExpired',
	'auth.otp.expired': 'codeExpired',
	'auth.otp.too_many_attempts': 'tooManyAttempts',
	'auth.otp.resend_cooldown': 'resendCooldown',
	'auth.email.send_failed': 'emailSendFailed',
	'auth.account_banned': 'accountSuspended',
	'auth.sms.send_failed': 'smsSendFailed',
	'user.phone.taken': 'phoneTaken',
};

/** Seconds left on a resend cooldown, which the API states only in its (localized) message. */
export function cooldownSeconds(errorCode: string | undefined, message: string) {
	if (errorCode !== 'auth.otp.resend_cooldown') return undefined;
	const seconds = Number(/\d+/.exec(message)?.[0]);
	return seconds > 0 ? seconds : undefined;
}

/** An `auth.*` code with `apiError` copy that needs no `{0}` value. */
function hasApiErrorCopy(errorCode: string) {
	const text = errorCode.split('.').reduce<unknown>(
		(node, part) => (node as Record<string, unknown> | undefined)?.[part],
		en.apiError
	);
	return typeof text === 'string' && !/\{\d+\}/.test(text);
}

/**
 * Maps a backend `errorCode` and HTTP status to a message the UI can show. `badRequest` is the copy for a 400
 * with no copy of its own, which only the caller knows the input of.
 */
export function toAuthErrorKey(
	errorCode: string | undefined,
	status?: number,
	badRequest: AuthErrorKey = 'serverError'
): AuthErrorKey {
	if (errorCode && ERROR_CODES[errorCode]) return ERROR_CODES[errorCode];
	if (errorCode?.startsWith('auth.') && hasApiErrorCopy(errorCode)) return `apiError.${errorCode}` as AuthErrorKey;
	if (status === 429) return 'rateLimited';
	if (status === 400) return badRequest;
	return 'serverError';
}
