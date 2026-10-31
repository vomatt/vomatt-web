import { topicsFor } from '@/app/(frontend)/explore/_components/ExploreView';
import { filtersFromParams, toExploreQuery, toExploreSearch } from '@/app/(frontend)/explore/filters';

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

	it('counts characters as the API does, so one emoji is too short', () => {
		expect(toExploreQuery('😀', 'open', 'newest').q).toBeUndefined();
		expect(toExploreQuery('😀😀', 'open', 'newest').q).toBe('😀😀');
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

describe('filtersFromParams()', () => {
	it('reads the search, status, sort and topic from the address', () => {
		expect(filtersFromParams({ q: 'lunch', status: 'ended', sort: 'top', tag: 'food' })).toEqual({
			query: 'lunch',
			status: 'ended',
			sort: 'top',
			tag: 'food',
		});
	});

	it('falls back to open, newest, no search for missing or unknown values', () => {
		expect(filtersFromParams({ status: 'archived', sort: 'random' })).toEqual({
			query: '',
			status: 'open',
			sort: 'newest',
			tag: undefined,
		});
	});

	it('takes the first of a repeated parameter', () => {
		expect(filtersFromParams({ q: ['one', 'two'] }).query).toBe('one');
	});
});

describe('toExploreSearch()', () => {
	it('writes only what differs from the default list', () => {
		expect(toExploreSearch(toExploreQuery('', 'open', 'newest'))).toBe('');
		expect(toExploreSearch(toExploreQuery('a', 'open', 'newest'))).toBe('');
		expect(toExploreSearch(toExploreQuery('lunch', 'ended', 'top', 'food'))).toBe('?status=ended&tag=food&q=lunch');
		expect(toExploreSearch(toExploreQuery('', 'open', 'closing'))).toBe('?sort=closing');
	});

	it('round-trips through filtersFromParams()', () => {
		const search = toExploreSearch(toExploreQuery('side project', 'open', 'top', 'food'));
		const { query, status, sort, tag } = filtersFromParams(Object.fromEntries(new URLSearchParams(search)));
		expect(toExploreQuery(query, status, sort, tag)).toEqual(toExploreQuery('side project', 'open', 'top', 'food'));
	});
});
