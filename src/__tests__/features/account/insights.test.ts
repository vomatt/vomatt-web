import { ballotOutcome, computeInsights } from '@/features/account/insights';
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

describe('computeInsights()', () => {
	it('sums the turnout of the user\'s polls', () => {
		const insights = computeInsights([poll('a', { a: 8, b: 4 }, true), poll('b', { a: 1, b: 2 }, false)]);
		expect(insights).toEqual({ turnout: 15 });
	});

	it('is zero with no polls', () => {
		expect(computeInsights([]).turnout).toBe(0);
	});
});
