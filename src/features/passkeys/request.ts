/**
 * Browsers that can't show the passkey sheet (no WebAuthn UI, page not focused, lapsed user
 * activation) reject in ~20ms (measured in Chromium); nobody closes a sheet that fast.
 */
const REFUSED_WITHIN_MS = 200;

/** The browser rejected the request before any passkey sheet could show. */
export class PasskeyRefusedError extends Error {
	name = 'PasskeyRefusedError';
}

function errorName(error: unknown) {
	return (error as { name?: string } | null)?.name ?? '';
}

/**
 * Runs a WebAuthn request. Browsers report a refusal and a closed sheet with the same
 * NotAllowedError, so one that comes back too fast for a person is thrown as PasskeyRefusedError.
 */
export async function requestPasskey<T>(request: () => Promise<T>): Promise<T> {
	const startedAt = performance.now();
	try {
		return await request();
	} catch (error) {
		if (errorName(error) === 'NotAllowedError' && performance.now() - startedAt < REFUSED_WITHIN_MS) {
			throw new PasskeyRefusedError();
		}
		throw error;
	}
}

/** The user closed the passkey sheet, it timed out, or the request was aborted: nothing to report. */
export function isPasskeyCancelled(error: unknown) {
	return ['NotAllowedError', 'AbortError'].includes(errorName(error));
}
