import type { ActionFailure } from '@/lib/api/action';

type Translate = (key: string) => string;

// e.g. "Minimum {0} options required": only the API's message has the value filled in
const PLACEHOLDER = /\{\d+\}/;

// The API's message names the field or reason; our copy for these is generic
const DETAILED_CODES = ['common.validation_failed', 'common.bad_request'];

// Codes shown with our own wording instead of the `apiError.*` copy
const OVERRIDES: Record<string, string> = { 'common.conflict': 'common.busy' };

/**
 * The text to show for a failed action: our `apiError.*` copy of its errorCode,
 * else the API's own message (localized via Accept-Language), else `fallbackKey`.
 */
export function apiErrorText(
	t: Translate,
	failure: Pick<ActionFailure, 'errorCode' | 'message'>,
	fallbackKey = 'common.error'
) {
	// Without an errorCode the message is a raw English one, e.g. "Request failed with status 502"
	const code = failure.errorCode;
	if (!code) return t(fallbackKey);
	if (OVERRIDES[code]) return t(OVERRIDES[code]);
	const key = `apiError.${code}`;
	const text = t(key);
	if (text !== key && !PLACEHOLDER.test(text) && !DETAILED_CODES.includes(code)) return text;
	return failure.message || t(fallbackKey);
}
