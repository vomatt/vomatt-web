import { unstable_rethrow } from 'next/navigation';

import type { ActionFailure } from '@/lib/api/action';

/**
 * A Server Action called from the browser can still reject (a network drop, a
 * deploy that changed its id). Turns that into the generic failure, so callers
 * handle one shape and show their usual error. A redirect from the action also
 * arrives as a rejection while Next navigates, so it passes through.
 */
export function settle<R extends { ok: boolean }>(call: Promise<R>): Promise<R | ActionFailure> {
	return call.catch((error: unknown): ActionFailure => {
		unstable_rethrow(error);
		return { ok: false, message: 'Request failed' };
	});
}
