import { filterPolls } from '@/app/(frontend)/explore/_components/ExploreView';
import type { Poll } from '@/features/polls/schema';

const NOW = Date.parse('2026-10-05T12:00:00Z');

function poll(overrides: Partial<Poll>): Poll {
	return {
		id: 'p',
		title: 'Untitled',
		active: true,
		votingActive: true,
		creatorId: 'u',
		creatorUsername: 'u',
		createdAt: '2026-10-01T00:00:00Z',
		startTime: '2026-10-01T00:00:00Z',
		endTime: '2026-10-10T00:00:00Z',
		options: [{ id: 'o', text: 'Pizza' }],
		...overrides,
	};
}

const open = poll({ id: 'open', title: 'Lunch?', totalVotes: 3, endTime: '2026-10-06T00:00:00Z' });
const later = poll({ id: 'later', title: 'Dinner?', totalVotes: 9, createdAt: '2026-10-03T00:00:00Z' });
const ended = poll({ id: 'ended', title: 'Breakfast?', endTime: '2026-10-02T00:00:00Z' });
const all = [open, later, ended];

const ids = (polls: Poll[]) => polls.map((p) => p.id);

describe('filterPolls()', () => {
	it('searches titles and options, case-insensitively', () => {
		expect(ids(filterPolls(all, 'LUNCH', 'all', 'newest', NOW))).toEqual(['open']);
		expect(ids(filterPolls(all, 'pizza', 'all', 'newest', NOW))).toHaveLength(3);
	});

	it('filters by status', () => {
		expect(ids(filterPolls(all, '', 'ended', 'newest', NOW))).toEqual(['ended']);
		expect(ids(filterPolls(all, '', 'open', 'newest', NOW)).sort()).toEqual(['later', 'open']);
	});

	it('sorts by turnout and by end time', () => {
		expect(ids(filterPolls(all, '', 'open', 'popular', NOW))).toEqual(['later', 'open']);
		expect(ids(filterPolls(all, '', 'open', 'ending', NOW))).toEqual(['open', 'later']);
	});
});
