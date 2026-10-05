import type { Poll } from './schema';

/**
 * `closing` is a UI hint only (an Open Poll ending within a day). It is never
 * sent to the API.
 */
export type PollStatus = 'scheduled' | 'open' | 'closing' | 'ended';

export const CLOSING_WINDOW_MS = 24 * 60 * 60 * 1000;

type StatusFields = Pick<Poll, 'active' | 'votingActive' | 'startTime' | 'endTime'>;

/** Ended wins over Scheduled, so a cancelled Scheduled Poll reads as Ended. */
export function derivePollStatus(poll: StatusFields, now: Date | number = Date.now()): PollStatus {
	const time = typeof now === 'number' ? now : now.getTime();
	const end = poll.endTime ? Date.parse(poll.endTime) : null;

	if (!poll.active || (end !== null && end <= time)) return 'ended';
	if (Date.parse(poll.startTime) > time) return 'scheduled';
	if (!poll.votingActive) return 'ended';
	if (end !== null && end - time < CLOSING_WINDOW_MS) return 'closing';
	return 'open';
}

export function isVotingOpen(status: PollStatus) {
	return status === 'open' || status === 'closing';
}

/** Turnout: how many people hold a Ballot. Visible in every state. */
export function getTurnout(poll: Pick<Poll, 'participantCount' | 'totalVotes'>) {
	return poll.participantCount ?? poll.totalVotes;
}
