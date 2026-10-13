import { z } from 'zod';

import { collectPages, cursorPageSchema, mergeById, pageParams } from '@/lib/api/cursor';

const Item = z.object({ id: z.string() });
const Page = cursorPageSchema(Item);

describe('cursorPageSchema()', () => {
	it('parses { items, nextCursor }', () => {
		expect(Page.parse({ items: [{ id: 'a' }], nextCursor: 'xyz' })).toEqual({
			items: [{ id: 'a' }],
			nextCursor: 'xyz',
		});
	});

	it('treats a missing nextCursor as the last page', () => {
		expect(Page.parse({ items: [] }).nextCursor).toBeNull();
	});

	it('rejects other shapes', () => {
		expect(() => Page.parse({ data: [] })).toThrow();
		// The old offset page is gone from the API
		expect(() => Page.parse({ content: [], total: 0, page: 1, limit: 20 })).toThrow();
	});
});

describe('pageParams()', () => {
	it('sends only the limit on the first page', () => {
		expect(pageParams(null, 20).toString()).toBe('limit=20');
	});

	it('passes the cursor back as given', () => {
		expect(pageParams('abc=', 10).get('cursor')).toBe('abc=');
	});
});

describe('mergeById()', () => {
	it('appends new items and drops duplicates', () => {
		expect(mergeById([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }])).toEqual([
			{ id: 'a' },
			{ id: 'b' },
			{ id: 'c' },
		]);
	});
});

describe('collectPages()', () => {
	const pages: Record<string, { items: number[]; nextCursor: string | null }> = {
		start: { items: [1], nextCursor: 'b' },
		b: { items: [2], nextCursor: 'c' },
		c: { items: [3], nextCursor: null },
	};
	const fetchPage = jest.fn(async (cursor: string | null) => pages[cursor ?? 'start']);

	beforeEach(() => fetchPage.mockClear());

	it('reads to the last page', async () => {
		expect(await collectPages(fetchPage, { maxPages: 10 })).toEqual({
			items: [1, 2, 3],
			nextCursor: null,
			pages: 3,
		});
	});

	it('stops early when `until` holds, and resumes from a cursor', async () => {
		const first = await collectPages(fetchPage, { maxPages: 10, until: (items) => items.length >= 1 });
		expect(first).toEqual({ items: [1], nextCursor: 'b', pages: 1 });
		expect(await collectPages(fetchPage, { cursor: 'b', maxPages: 1 })).toEqual({
			items: [2],
			nextCursor: 'c',
			pages: 1,
		});
	});
});
