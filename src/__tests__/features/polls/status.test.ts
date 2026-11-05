import {
	derivePollStatus,
	endedEarly,
	getTurnout,
	isCancelled,
	isInvitee,
	nextStatusChange,
	timelineProgress,
	visibilityLevel,
} from '@/features/polls/status';

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

describe('nextStatusChange()', () => {
	const at = (h: number) => NOW + h * 3600_000;

	it('is when an Open Poll starts closing, a day before its end', () => {
		expect(nextStatusChange(base, NOW)).toBe(at(48));
	});

	it('is the end for a closing Poll', () => {
		expect(nextStatusChange({ ...base, endTime: hours(5) }, NOW)).toBe(at(5));
	});

	it('is the end for a Scheduled copy: until a refetch it can only say when voting ends', () => {
		expect(
			nextStatusChange({ ...base, votingActive: false, startTime: hours(1), endTime: hours(72) }, NOW)
		).toBe(at(72));
	});

	it('never comes for an Ended Poll or one without an end', () => {
		expect(nextStatusChange({ ...base, endTime: hours(-1) }, NOW)).toBeNull();
		expect(nextStatusChange({ ...base, active: false }, NOW)).toBeNull();
		expect(nextStatusChange({ ...base, endTime: null }, NOW)).toBeNull();
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

describe('timelineProgress()', () => {
	const window = { startTime: '2026-10-01T00:00:00Z', endTime: '2026-10-03T00:00:00Z' };

	it('is the share of the voting window that has passed', () => {
		expect(timelineProgress(window, Date.parse('2026-10-02T00:00:00Z'))).toBe(50);
	});

	it('clamps before the start and after the end', () => {
		expect(timelineProgress(window, Date.parse('2026-09-01T00:00:00Z'))).toBe(0);
		expect(timelineProgress(window, Date.parse('2026-11-01T00:00:00Z'))).toBe(100);
	});

	it('is null without an end time', () => {
		expect(timelineProgress({ ...window, endTime: null })).toBeNull();
	});
});

describe('isCancelled()', () => {
	it('is true when the poll closed before it opened', () => {
		expect(isCancelled({ startTime: hours(5), endTime: hours(-1) })).toBe(true);
	});

	it('is false for a poll that ran', () => {
		expect(isCancelled(base)).toBe(false);
	});
});

describe('endedEarly()', () => {
	it('is true when the Poll ended before its Deadline', () => {
		expect(endedEarly({ endTime: hours(-2), deadline: hours(24) })).toBe(true);
	});

	it('is false when it ran to its Deadline, or the API sends none', () => {
		expect(endedEarly({ endTime: hours(-2), deadline: hours(-2) })).toBe(false);
		expect(endedEarly({ endTime: hours(-2) })).toBe(false);
	});
});

describe('isInvitee()', () => {
	it('is true for anyone but the owner viewing an Invite-only Poll', () => {
		expect(isInvitee({ audience: 'invite-only', creatorId: 'owner' }, 'bob')).toBe(true);
	});

	it('is false for the owner, and on other Audiences', () => {
		expect(isInvitee({ audience: 'invite-only', creatorId: 'owner' }, 'owner')).toBe(false);
		expect(isInvitee({ audience: 'unlisted', creatorId: 'owner' }, 'bob')).toBe(false);
		expect(isInvitee({ audience: undefined, creatorId: 'owner' }, 'bob')).toBe(false);
	});
});

describe('visibilityLevel()', () => {
	it('reads signed-in as invited on an Invite-only Poll', () => {
		expect(visibilityLevel({ voterVisibility: 'signed-in', audience: 'invite-only' })).toBe('invited');
	});

	it('keeps the level everywhere else', () => {
		expect(visibilityLevel({ voterVisibility: 'signed-in', audience: 'public' })).toBe('signed-in');
		expect(visibilityLevel({ voterVisibility: 'owner', audience: 'invite-only' })).toBe('owner');
		expect(visibilityLevel({ voterVisibility: undefined, audience: 'public' })).toBeUndefined();
	});
});
