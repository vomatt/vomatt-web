/** Returned by the API when a Ballot arrives after the Poll has Ended. */
export const POLL_ENDED_ERROR = 'vote.ended';

export type ActionFailure = {
	ok: false;
	status?: number;
	errorCode?: string;
	message: string;
};

/**
 * Server Actions return this instead of throwing: errors thrown across the
 * action boundary lose their status and errorCode in production.
 */
export type ActionResult<T = void> = { ok: true; data: T } | ActionFailure;

export function isPollEnded(result: ActionResult<unknown>) {
	return !result.ok && result.errorCode === POLL_ENDED_ERROR;
}

/** Results are sealed while the Poll is Open; `/results` answers 403. */
export function isSealed(result: ActionResult<unknown>) {
	return !result.ok && result.status === 403;
}
