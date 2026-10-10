import { toExploreQuery } from '@/app/(frontend)/explore/_components/ExploreView';

jest.mock('@/features/polls/service', () => ({ getPolls: jest.fn() }));

describe('toExploreQuery()', () => {
	it('sends the sort with open polls', () => {
		expect(toExploreQuery('', 'open', 'closing')).toEqual({ status: 'open', sort: 'closing', q: undefined });
	});

	it('drops the sort for ended polls, which the API rejects', () => {
		expect(toExploreQuery('', 'ended', 'closing').sort).toBeUndefined();
	});

	it('trims the search and skips one shorter than 2 characters', () => {
		expect(toExploreQuery('  side project ', 'open', 'newest').q).toBe('side project');
		expect(toExploreQuery(' a ', 'open', 'newest').q).toBeUndefined();
	});
});
