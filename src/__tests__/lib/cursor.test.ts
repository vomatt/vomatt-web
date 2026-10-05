import { z } from 'zod';

import { cursorPageSchema, mergeById } from '@/lib/api/cursor';

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

	it('parses a Spring page, using the next page number as the cursor', () => {
		expect(Page.parse({ content: [{ id: 'a' }], last: false, number: 2 })).toEqual({
			items: [{ id: 'a' }],
			nextCursor: '3',
		});
	});

	it('returns no cursor on the last Spring page', () => {
		expect(Page.parse({ content: [], last: true, number: 4 }).nextCursor).toBeNull();
	});

	it('rejects other shapes', () => {
		expect(() => Page.parse({ data: [] })).toThrow();
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
