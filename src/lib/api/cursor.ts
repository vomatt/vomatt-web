import { z } from 'zod';

/** `total` is known only when the API sends it. */
export type CursorPage<T> = { items: T[]; nextCursor: string | null; total?: number };

/**
 * Parses `{ items, nextCursor }`, and also the page shapes the API returns
 * until cursor pagination ships. For those the cursor is the next page
 * number, in the numbering the API expects (1-based for PageResponse).
 */
export function cursorPageSchema<T extends z.ZodTypeAny>(item: T) {
	const cursorShape = z
		.object({ items: z.array(item), nextCursor: z.string().nullish() })
		.transform((page) => ({ items: page.items, nextCursor: page.nextCursor ?? null }));
	const springShape = z
		.object({ content: z.array(item), last: z.boolean(), number: z.number().int() })
		.transform((page) => ({
			items: page.content,
			nextCursor: page.last ? null : String(page.number + 1),
		}));

	// vomatt-api PageResponse: 1-based `page`
	const pageResponseShape = z
		.object({
			content: z.array(item),
			total: z.number().int(),
			page: z.number().int(),
			limit: z.number().int(),
		})
		.transform((page) => ({
			items: page.content,
			nextCursor: page.page * page.limit < page.total ? String(page.page + 1) : null,
			total: page.total,
		}));

	return z.union([cursorShape, pageResponseShape, springShape]) as unknown as z.ZodType<
		CursorPage<z.output<T>>
	>;
}

/** Appends `next` to `prev`, dropping items whose id is already present. */
export function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
	const seen = new Set(prev.map((item) => item.id));
	return [...prev, ...next.filter((item) => !seen.has(item.id))];
}
