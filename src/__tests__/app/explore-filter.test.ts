import { toExploreQuery, topicsFor } from '@/app/(frontend)/explore/_components/ExploreView';

jest.mock('@/features/polls/service', () => ({ getPolls: jest.fn() }));

describe('toExploreQuery()', () => {
	it('sends the sort with open polls', () => {
		expect(toExploreQuery('', 'open', 'closing')).toEqual({ status: 'open', sort: 'closing', q: undefined, tag: undefined });
	});

	it('drops the sort for ended polls, which the API rejects', () => {
		expect(toExploreQuery('', 'ended', 'closing').sort).toBeUndefined();
	});

	it('trims the search and skips one shorter than 2 characters', () => {
		expect(toExploreQuery('  side project ', 'open', 'newest').q).toBe('side project');
		expect(toExploreQuery(' a ', 'open', 'newest').q).toBeUndefined();
	});
});

describe('topicsFor()', () => {
	const tag = (slug: string, name: string, usageCount: number) => ({ id: slug, slug, name, usageCount });
	// Most used first, as getTags() sends them
	const topics = [tag('transport', 'Transport', 9), tag('city', '城市', 5), tag('food', 'Food', 3)];

	it('offers the first topics without a search', () => {
		expect(topicsFor(topics, undefined).map((t) => t.slug)).toEqual(['transport', 'city', 'food']);
	});

	it('matches the name case-insensitively, the slug, and CJK names', () => {
		expect(topicsFor(topics, 'FOO').map((t) => t.slug)).toEqual(['food']);
		expect(topicsFor(topics, 'city').map((t) => t.slug)).toEqual(['city']);
		expect(topicsFor(topics, '城').map((t) => t.slug)).toEqual(['city']);
	});

	it('offers nothing when no topic matches, and at most 8', () => {
		expect(topicsFor(topics, 'zzz')).toEqual([]);
		const many = Array.from({ length: 12 }, (_, i) => tag(`t${i}`, `T${i}`, i));
		expect(topicsFor(many, undefined)).toHaveLength(8);
	});
});

describe('toExploreQuery() with a topic', () => {
	it('sends the topic', () => {
		expect(toExploreQuery('', 'ended', 'newest', 'food').tag).toBe('food');
	});
});
