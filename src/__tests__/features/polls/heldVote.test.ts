import { holdVote, releaseHeldVote, takeHeldVote } from '@/features/polls/heldVote';

const MINUTE = 60_000;

beforeEach(() => {
	sessionStorage.clear();
	jest.restoreAllMocks();
});

describe('held vote', () => {
	it('gives back the option held for a poll', () => {
		holdVote('poll-1', 'opt-sun');
		expect(takeHeldVote('poll-1')).toBe('opt-sun');
	});

	it('gives nothing for another poll', () => {
		holdVote('poll-1', 'opt-sun');
		expect(takeHeldVote('poll-2')).toBeNull();
	});

	it('lets a vote go after 15 minutes', () => {
		const now = Date.now();
		jest.spyOn(Date, 'now').mockReturnValue(now);
		holdVote('poll-1', 'opt-sun');
		jest.spyOn(Date, 'now').mockReturnValue(now + 15 * MINUTE + 1);
		expect(takeHeldVote('poll-1')).toBeNull();
	});

	it('forgets a released vote', () => {
		holdVote('poll-1', 'opt-sun');
		releaseHeldVote();
		expect(takeHeldVote('poll-1')).toBeNull();
	});

	it('reads nothing from a malformed entry', () => {
		sessionStorage.setItem('vomatt_held_vote', '{nope');
		expect(takeHeldVote('poll-1')).toBeNull();
	});
});
