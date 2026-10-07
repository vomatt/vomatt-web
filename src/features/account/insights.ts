import type { Poll } from '@/features/polls/schema';
import { derivePollStatus, getTurnout } from '@/features/polls/status';

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
	const top = Math.max(...poll.options.map((option) => option.votes ?? 0));
	const winners = poll.options.filter((option) => (option.votes ?? 0) === top);
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

export type BadgeId =
	| 'firstBallot'
	| 'regular'
	| 'pillar'
	| 'questionAsker'
	| 'crowdGatherer'
	| 'trendReader'
	| 'contrarian';

export type Insights = {
	votesCast: number;
	pollsCreated: number;
	/** People who voted on the user's polls. */
	peopleReached: number;
	/** Share of decided Ballots where the pick won or tied, 0–100; null before any are decided. */
	majorityRate: number | null;
	awaitingResults: number;
	badges: { id: BadgeId; earned: boolean }[];
};

export function computeInsights(
	{ totalVotes, totalPolls }: { totalVotes: number; totalPolls: number },
	myPolls: Poll[],
	history: BallotRecord[]
): Insights {
	const decided = history.filter((record) => record.outcome !== 'pending' && record.outcome !== 'unknown');
	const withMajority = decided.filter((record) => record.outcome !== 'lost').length;
	const turnouts = myPolls.map((poll) => getTurnout(poll) ?? 0);
	const majorityRate = decided.length ? Math.round((withMajority / decided.length) * 100) : null;

	const earned: Record<BadgeId, boolean> = {
		firstBallot: totalVotes >= 1,
		regular: totalVotes >= 10,
		pillar: totalVotes >= 50,
		questionAsker: totalPolls >= 1,
		crowdGatherer: turnouts.some((count) => count >= 10),
		trendReader: decided.length >= 3 && (majorityRate ?? 0) >= 60,
		contrarian: decided.length - withMajority >= 3,
	};

	return {
		votesCast: totalVotes,
		pollsCreated: totalPolls,
		peopleReached: turnouts.reduce((sum, count) => sum + count, 0),
		majorityRate,
		awaitingResults: history.filter((record) => record.outcome === 'pending').length,
		badges: (Object.keys(earned) as BadgeId[]).map((id) => ({ id, earned: earned[id] })),
	};
}
