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

	it('rejects a page with an item that fails validation', () => {
		expect(() => Page.parse({ items: [{ id: 'a' }, { id: 7 }] })).toThrow();
	});

	describe('with skipInvalid', () => {
		const Lenient = cursorPageSchema(Item, { skipInvalid: true });

		it('leaves out the items that fail validation, keeps the rest and logs once', () => {
			const logged = jest.spyOn(console, 'error').mockImplementation(() => {});
			expect(Lenient.parse({ items: [{ id: 'a' }, { id: 7 }, { id: 'c' }, { id: 8 }], nextCursor: 'xyz' })).toEqual({
				items: [{ id: 'a' }, { id: 'c' }],
				nextCursor: 'xyz',
			});
			expect(logged).toHaveBeenCalledTimes(1);
			expect(logged.mock.calls[0][1].ids).toEqual([7, 8]);
			logged.mockRestore();
		});

		it('rejects a page where every item fails, so it never reads as an empty list', () => {
			expect(() => Lenient.parse({ items: [{ id: 7 }, { id: 8 }] })).toThrow();
		});

		it('parses an empty page', () => {
			expect(Lenient.parse({ items: [] }).items).toEqual([]);
		});
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
