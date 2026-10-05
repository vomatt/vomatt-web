import { derivePollStatus, getTurnout, isVotingOpen } from '@/features/polls/status';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const hours = (h: number) => new Date(NOW + h * 3600_000).toISOString();

const base = {
	active: true,
	votingActive: true,
	startTime: hours(-48),
	endTime: hours(72),
};

describe('derivePollStatus()', () => {
	it('is open between start and end', () => {
		expect(derivePollStatus(base, NOW)).toBe('open');
	});

	it('is closing when the end is under 24h away', () => {
		expect(derivePollStatus({ ...base, endTime: hours(5) }, NOW)).toBe('closing');
	});

	it('is scheduled before the start time', () => {
		expect(
			derivePollStatus({ ...base, votingActive: false, startTime: hours(48) }, NOW)
		).toBe('scheduled');
	});

	it('is ended once the end time passes', () => {
		expect(derivePollStatus({ ...base, endTime: hours(-1) }, NOW)).toBe('ended');
	});

	it('is ended when the owner closes it early', () => {
		expect(derivePollStatus({ ...base, active: false }, NOW)).toBe('ended');
	});

	it('is ended when voting is inactive after the start time', () => {
		expect(derivePollStatus({ ...base, votingActive: false }, NOW)).toBe('ended');
	});

	it('lets Ended win over Scheduled for a cancelled Poll', () => {
		expect(
			derivePollStatus(
				{ ...base, active: false, votingActive: false, startTime: hours(48) },
				NOW
			)
		).toBe('ended');
	});

	it('treats a Poll without an end time as open', () => {
		expect(derivePollStatus({ ...base, endTime: null }, NOW)).toBe('open');
	});

	it('accepts a Date', () => {
		expect(derivePollStatus(base, new Date(NOW))).toBe('open');
	});
});

describe('isVotingOpen()', () => {
	it('is true only for open and closing', () => {
		expect(isVotingOpen('open')).toBe(true);
		expect(isVotingOpen('closing')).toBe(true);
		expect(isVotingOpen('scheduled')).toBe(false);
		expect(isVotingOpen('ended')).toBe(false);
	});
});

describe('getTurnout()', () => {
	it('prefers participantCount', () => {
		expect(getTurnout({ participantCount: 4, totalVotes: 9 })).toBe(4);
	});

	it('falls back to totalVotes', () => {
		expect(getTurnout({ totalVotes: 9 })).toBe(9);
	});

	it('is undefined when neither is present', () => {
		expect(getTurnout({})).toBeUndefined();
	});
});
