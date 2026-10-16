import type { ActionResult } from '@/lib/api/action';

export type { ActionFailure, ActionResult } from '@/lib/api/action';

/** Returned by the API when a Ballot arrives after the Poll has Ended. */
const POLL_ENDED_ERRORS = ['vote.ended'];

export function isPollEnded(result: ActionResult<unknown>) {
	return !result.ok && !!result.errorCode && POLL_ENDED_ERRORS.includes(result.errorCode);
}

/** 429: e.g. more than 30 Ballot writes a minute, which sends no Retry-After. */
export function isRateLimited(result: ActionResult<unknown>) {
	return !result.ok && result.status === 429;
}

/** Results are sealed while the Poll is Open; `/results` answers 403. */
export function isSealed(result: ActionResult<unknown>) {
	return !result.ok && result.status === 403;
}
