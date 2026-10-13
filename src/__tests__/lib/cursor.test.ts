import { z } from 'zod';

import { cursorPageSchema, mergeById, pageParams } from '@/lib/api/cursor';

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
