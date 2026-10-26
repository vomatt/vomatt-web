import type { ActionFailure, ActionResult } from '@/lib/api/action';

/**
 * A Server Action called from the browser can still reject (a network drop, a
 * deploy that changed its id). Turns that into the generic failure, so callers
 * handle one shape and show their usual error.
 */
export function settle<T>(call: Promise<ActionResult<T>>): Promise<ActionResult<T>> {
	return call.catch((): ActionFailure => ({ ok: false, message: 'Request failed' }));
}
