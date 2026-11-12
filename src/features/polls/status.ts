import type { Poll } from './schema';

/**
 * `closing` is a UI hint only (an Open Poll ending within a day). It is never
 * sent to the API.
 */
export type PollStatus = 'scheduled' | 'open' | 'closing' | 'ended';

const CLOSING_WINDOW_MS = 24 * 60 * 60 * 1000;

export type StatusFields = Pick<Poll, 'active' | 'votingActive' | 'startTime' | 'endTime' | 'revealAt'>;

/** Ended wins over Scheduled, so an old cancelled Scheduled Poll reads as Ended. */
export function derivePollStatus(poll: StatusFields, now: Date | number = Date.now()): PollStatus {
	const time = typeof now === 'number' ? now : now.getTime();
	const end = poll.endTime ? Date.parse(poll.endTime) : null;

	if (!poll.active || (end !== null && end <= time)) return 'ended';
	if (Date.parse(poll.startTime) > time) return 'scheduled';
	if (!poll.votingActive) return 'ended';
	if (end !== null && end - time < CLOSING_WINDOW_MS) return 'closing';
	return 'open';
}

/** When the Poll's counts come out: its `revealAt`, or else its end. Null for a Poll without either. */
export function revealTime(poll: Pick<Poll, 'endTime' | 'revealAt'>) {
	return poll.revealAt ?? poll.endTime ?? null;
}

/**
 * Whether the Poll's counts are out: Ended, and past its `revealAt` if it has one. Until then the API
 * sends no `votes` and answers `/results` and `/voters` with 403 `vote.results.sealed`.
 */
export function isRevealed(poll: StatusFields, now: Date | number = Date.now()) {
	const time = typeof now === 'number' ? now : now.getTime();
	// Not revealTime(): a Poll Ended early by its owner may still carry its planned end
	return derivePollStatus(poll, time) === 'ended' && (!poll.revealAt || Date.parse(poll.revealAt) <= time);
}

/**
 * When the clock next changes the Poll's status: the start of its last day, then its end, then its
 * `revealAt`. Null once revealed or without an end. A Scheduled copy says `votingActive: false`, which
 * would read as Ended once the start passes, so only its end counts; it shows as Open once fetched again.
 */
export function nextStatusChange(poll: StatusFields, now: number): number | null {
	if (derivePollStatus(poll, now) === 'ended') {
		const reveal = poll.revealAt ? Date.parse(poll.revealAt) : null;
		return reveal !== null && reveal > now ? reveal : null;
	}
	if (!poll.endTime) return null;
	const end = Date.parse(poll.endTime);
	const closing = end - CLOSING_WINDOW_MS;
	return poll.votingActive && closing > now ? closing : end;
}

/**
 * Cancelled: closed before it opened, so it never took a Ballot or sends a
 * notification. The API no longer cancels (Scheduled Polls are Deleted), but old ones remain.
 */
export function isCancelled(poll: Pick<Poll, 'startTime' | 'endTime'>) {
	return !!poll.endTime && Date.parse(poll.endTime) <= Date.parse(poll.startTime);
}

/**
 * Voter Visibility as the viewer should read it: on an Invite-only Poll
 * "signed in" covers only the owner and the Invitees.
 */
export function visibilityLevel(poll: Pick<Poll, 'voterVisibility' | 'audience'>) {
	return poll.voterVisibility === 'signed-in' && poll.audience === 'invite-only'
		? 'invited'
		: poll.voterVisibility;
}

/**
 * Only the owner and its Invitees can see an Invite-only Poll, so any other
 * viewer of one is an Invitee. The API has no flag for it (integration note R2).
 */
export function isInvitee(poll: Pick<Poll, 'audience' | 'creatorId'>, viewerId: string) {
	return poll.audience === 'invite-only' && poll.creatorId !== viewerId;
}

/** Listed and indexable; Polls from before Audiences have none and are public. */
export function isPublic(poll: Pick<Poll, 'audience'>) {
	return !poll.audience || poll.audience === 'public';
}

/** Ended before its Deadline: Closed by the owner, or every Invitee voted. */
export function endedEarly(poll: Pick<Poll, 'endTime' | 'deadline'>) {
	return !!poll.endTime && !!poll.deadline && Date.parse(poll.endTime) < Date.parse(poll.deadline);
}

/** The options with the most votes; none when nobody voted. */
export function getWinners<T extends { votes: number }>(rows: T[]): T[] {
	const top = Math.max(0, ...rows.map((row) => row.votes));
	return top > 0 ? rows.filter((row) => row.votes === top) : [];
}

/** Whether the viewer holds a Ballot in the Poll. A sealed Anonymous Ballot has no option left, only its flag. */
export const holdsBallot = (poll: Pick<Poll, 'myOptionId' | 'myBallotAnonymous'>) =>
	!!poll.myOptionId || poll.myBallotAnonymous != null;

/** Turnout: how many people hold a Ballot. Visible in every state. */
export function getTurnout(poll: Pick<Poll, 'participantCount' | 'totalVotes'>) {
	return poll.participantCount ?? poll.totalVotes;
}

/** How far through its voting window the Poll is, 0–100. */
export function timelineProgress(poll: Pick<Poll, 'startTime' | 'endTime'>, now = Date.now()) {
	if (!poll.endTime) return null;
	const start = Date.parse(poll.startTime);
	const end = Date.parse(poll.endTime);
	if (end <= start) return 100;
	return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

/** Moves an optimistic count, never below 0; an unknown count stays unknown. */
export function shiftCount(count: number | undefined, by: number) {
	return count === undefined ? undefined : Math.max(0, count + by);
}
