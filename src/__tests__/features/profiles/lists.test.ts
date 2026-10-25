import type { Poll } from '@/features/polls/schema';
import {
	askedPolls,
	endedSummary,
	picksWonRate,
	splitAsked,
	splitVoted,
	votedPolls,
} from '@/features/profiles/lists';

const NOW = Date.parse('2026-10-05T12:00:00Z');

function poll(
	id: string,
	{
		votes = null,
		state = 'open',
		myOptionId,
		creatorId = 'other',
		startTime = '2026-10-01T00:00:00Z',
	}: {
		votes?: Record<string, number> | null;
		state?: 'scheduled' | 'open' | 'ended' | 'cancelled';
		myOptionId?: string;
		creatorId?: string;
		startTime?: string;
	} = {}
): Poll {
	const start = state === 'scheduled' ? '2026-10-08T00:00:00Z' : startTime;
	const end = { scheduled: '2026-10-09T00:00:00Z', open: '2026-10-09T00:00:00Z', ended: '2026-10-04T00:00:00Z', cancelled: start }[state];
	return {
		id,
		title: id,
		active: true,
		votingActive: state === 'open',
		creatorId,
		creatorUsername: creatorId,
		createdAt: '2026-10-01T00:00:00Z',
		startTime: start,
		endTime: end,
		options: ['a', 'b', 'c'].map((key) => ({ id: key, text: key.toUpperCase(), votes: votes ? (votes[key] ?? 0) : undefined })),
		totalVotes: undefined,
		myOptionId,
	};
}

describe('splitAsked()', () => {
	it('puts scheduled and open polls before ended ones', () => {
		const { open, ended } = splitAsked([poll('e', { state: 'ended' }), poll('s', { state: 'scheduled' }), poll('o')], NOW);
		expect(open.map((p) => p.id)).toEqual(['s', 'o']);
		expect(ended.map((p) => p.id)).toEqual(['e']);
	});
});

describe('splitVoted()', () => {
	it('separates sealed ballots from decided ones', () => {
		const { sealed, decided } = splitVoted([poll('o', { myOptionId: 'a' }), poll('e', { state: 'ended', myOptionId: 'a' })], NOW);
		expect(sealed.map((p) => p.id)).toEqual(['o']);
		expect(decided.map((p) => p.id)).toEqual(['e']);
	});
});

describe('votedPolls() and askedPolls()', () => {
	const mine = poll('mine', { creatorId: 'me', myOptionId: 'a' });
	const theirsVoted = poll('voted', { myOptionId: 'b' });
	const invited = poll('invited');

	it('keeps polls the owner voted in but did not ask', () => {
		expect(votedPolls([mine, theirsVoted, invited], 'me').map((p) => p.id)).toEqual(['voted']);
	});

	it('keeps the owner\'s polls, most recently opened first', () => {
		const older = poll('older', { creatorId: 'me', startTime: '2026-09-01T00:00:00Z' });
		expect(askedPolls([older, theirsVoted, mine], 'me').map((p) => p.id)).toEqual(['mine', 'older']);
	});
});

describe('picksWonRate()', () => {
	it('is the share of decided ballots that won outright; a tie is not a win', () => {
		const polls = [
			poll('won', { state: 'ended', votes: { a: 3, b: 1 }, myOptionId: 'a' }),
			poll('lost', { state: 'ended', votes: { a: 3, b: 1 }, myOptionId: 'b' }),
			poll('tied', { state: 'ended', votes: { a: 2, b: 2 }, myOptionId: 'a' }),
			poll('won2', { state: 'ended', votes: { c: 5 }, myOptionId: 'c' }),
		];
		expect(picksWonRate(polls, NOW)).toBe(50);
	});

	it('leaves out open, hidden and cancelled polls', () => {
		const polls = [
			poll('open', { votes: { a: 1 }, myOptionId: 'a' }),
			poll('hidden', { state: 'ended', myOptionId: 'a' }),
			poll('cancelled', { state: 'cancelled', votes: { a: 1 }, myOptionId: 'a' }),
		];
		expect(picksWonRate(polls, NOW)).toBeNull();
	});
});

describe('endedSummary()', () => {
	it('names one winner', () => {
		expect(endedSummary(poll('p', { state: 'ended', votes: { a: 3, b: 1 } }))).toEqual({ kind: 'won', winner: 'A' });
	});

	it('names every option tied for first', () => {
		expect(endedSummary(poll('p', { state: 'ended', votes: { a: 2, b: 2 } }))).toEqual({ kind: 'tie', winners: ['A', 'B'] });
	});

	it('says nothing with no votes, hidden counts or a cancelled poll', () => {
		expect(endedSummary(poll('p', { state: 'ended', votes: {} }))).toEqual({ kind: 'none' });
		expect(endedSummary(poll('p', { state: 'ended' }))).toEqual({ kind: 'none' });
		expect(endedSummary(poll('p', { state: 'cancelled', votes: { a: 1 } }))).toEqual({ kind: 'none' });
	});
});
