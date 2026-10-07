import { ballotHistory, ballotOutcome, computeInsights } from '@/features/account/insights';
import type { Poll } from '@/features/polls/schema';

const NOW = Date.parse('2026-10-05T12:00:00Z');

function poll(id: string, votes: Record<string, number> | null, ended: boolean, myOptionId?: string): Poll {
	return {
		id,
		title: id,
		active: true,
		votingActive: !ended,
		creatorId: 'u',
		creatorUsername: 'u',
		createdAt: '2026-10-01T00:00:00Z',
		startTime: '2026-10-01T00:00:00Z',
		endTime: ended ? '2026-10-04T00:00:00Z' : '2026-10-09T00:00:00Z',
		options: ['a', 'b'].map((key) => ({ id: key, text: key.toUpperCase(), votes: votes ? votes[key] : undefined })),
		totalVotes: votes ? Object.values(votes).reduce((s, n) => s + n, 0) : undefined,
		myOptionId,
	};
}

describe('ballotOutcome()', () => {
	it('is pending while the poll is open', () => {
		expect(ballotOutcome(poll('p', { a: 1, b: 0 }, false), 'a', NOW)).toBe('pending');
	});
	it('reads won, lost and tied from the counts', () => {
		expect(ballotOutcome(poll('p', { a: 3, b: 1 }, true), 'a', NOW)).toBe('won');
		expect(ballotOutcome(poll('p', { a: 3, b: 1 }, true), 'b', NOW)).toBe('lost');
		expect(ballotOutcome(poll('p', { a: 2, b: 2 }, true), 'b', NOW)).toBe('tied');
	});
	it('is unknown when the counts are withheld', () => {
		expect(ballotOutcome(poll('p', null, true), 'a', NOW)).toBe('unknown');
	});
});

describe('ballotHistory()', () => {
	it('keeps only polls the viewer voted in, with the chosen text', () => {
		const history = ballotHistory([poll('x', { a: 1, b: 0 }, false, 'b'), poll('y', null, false)], NOW);
		expect(history).toHaveLength(1);
		expect(history[0]).toMatchObject({ choice: 'B', outcome: 'pending' });
	});
});

describe('computeInsights()', () => {
	const history = ballotHistory(
		[
			poll('w1', { a: 3, b: 1 }, true, 'a'),
			poll('w2', { a: 3, b: 1 }, true, 'a'),
			poll('l1', { a: 3, b: 1 }, true, 'b'),
			poll('open', { a: 0, b: 0 }, false, 'a'),
		],
		NOW
	);

	it('summarises votes, reach and the majority rate', () => {
		const insights = computeInsights(
			{ totalVotes: 12, totalPolls: 1 },
			[poll('mine', { a: 8, b: 4 }, true)],
			history
		);
		expect(insights).toMatchObject({
			votesCast: 12,
			pollsCreated: 1,
			peopleReached: 12,
			majorityRate: 67,
			awaitingResults: 1,
		});
		const earned = insights.badges.filter((b) => b.earned).map((b) => b.id);
		expect(earned).toEqual(['firstBallot', 'regular', 'questionAsker', 'crowdGatherer', 'trendReader']);
	});

	it('has no majority rate before anything is decided', () => {
		expect(computeInsights({ totalVotes: 0, totalPolls: 0 }, [], []).majorityRate).toBeNull();
	});
});
