import { z } from 'zod';

import { cursorPageSchema, mergeById, pageParams } from '@/lib/api/cursor';

const Item = z.object({ id: z.string() });
const Page = cursorPageSchema(Item);

describe('cursorPageSchema()', () => {
	it('reads the API page { content, total, page, limit }', () => {
		expect(Page.parse({ content: [{ id: 'a' }], total: 45, page: 1, limit: 20 })).toEqual({
			items: [{ id: 'a' }],
			nextCursor: '2',
		});
	});

	it('has no next page once the last item is in', () => {
		expect(Page.parse({ content: [], total: 40, page: 2, limit: 20 }).nextCursor).toBeNull();
		expect(Page.parse({ content: [], total: 0, page: 1, limit: 20 }).nextCursor).toBeNull();
	});

	it('stops at an empty page size rather than paging forever', () => {
		expect(Page.parse({ content: [], total: 5, page: 1, limit: 0 }).nextCursor).toBeNull();
	});

	it('rejects other shapes', () => {
		expect(() => Page.parse({ data: [] })).toThrow();
		expect(() => Page.parse({ items: [], nextCursor: null })).toThrow();
	});
});

describe('pageParams()', () => {
	it('asks for the first page without a cursor', () => {
		expect(pageParams(null, 20).toString()).toBe('page=1&size=20');
	});

	it('sends the cursor as the page number', () => {
		expect(pageParams('3', 10).get('page')).toBe('3');
	});

	it('clamps the size', () => {
		expect(pageParams(null, 500).get('size')).toBe('50');
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
