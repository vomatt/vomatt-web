import type { Poll } from '@/features/polls/schema';
import { derivePollStatus, getTurnout, getWinners } from '@/features/polls/status';

export type BallotOutcome = 'pending' | 'won' | 'tied' | 'lost' | 'unknown';

export type BallotRecord = {
	poll: Poll;
	choice: string;
	outcome: BallotOutcome;
};

/** Whether the viewer's pick won an Ended Poll; `pending` while it is still open. */
export function ballotOutcome(poll: Poll, optionId: string, now = Date.now()): BallotOutcome {
	if (derivePollStatus(poll, now) !== 'ended') return 'pending';
	if (poll.options.some((option) => option.votes === undefined)) return 'unknown';
	const winners = getWinners(poll.options.map((option) => ({ id: option.id, votes: option.votes ?? 0 })));
	if (!winners.some((option) => option.id === optionId)) return 'lost';
	return winners.length > 1 ? 'tied' : 'won';
}

/** The viewer's Ballots among `polls`, newest first. */
export function ballotHistory(polls: Poll[], now = Date.now()): BallotRecord[] {
	return polls
		.filter((poll): poll is Poll & { myOptionId: string } => !!poll.myOptionId)
		.map((poll) => ({
			poll,
			choice: poll.options.find((option) => option.id === poll.myOptionId)?.text ?? '',
			outcome: ballotOutcome(poll, poll.myOptionId, now),
		}));
}

export type Insights = {
	/** People who voted on the user's polls. */
	peopleReached: number;
	/** Share of decided Ballots where the pick won or tied, 0–100; null before any are decided. */
	majorityRate: number | null;
	awaitingResults: number;
};

export function computeInsights(
	myPolls: Poll[],
	history: BallotRecord[]
): Insights {
	const decided = history.filter((record) => record.outcome !== 'pending' && record.outcome !== 'unknown');
	const withMajority = decided.filter((record) => record.outcome !== 'lost').length;
	const turnouts = myPolls.map((poll) => getTurnout(poll) ?? 0);
	const majorityRate = decided.length ? Math.round((withMajority / decided.length) * 100) : null;

	return {
		peopleReached: turnouts.reduce((sum, count) => sum + count, 0),
		majorityRate,
		awaitingResults: history.filter((record) => record.outcome === 'pending').length,
	};
}
