import { z } from 'zod';

export type CursorPage<T> = { items: T[]; nextCursor: string | null };

/**
 * Parses `{ items, nextCursor }`, and also the Spring page shape the API
 * returns until cursor pagination ships. For a Spring page the cursor is the
 * next page number.
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

	return z.union([cursorShape, springShape]) as unknown as z.ZodType<CursorPage<z.output<T>>>;
}

/** Appends `next` to `prev`, dropping items whose id is already present. */
export function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
	const seen = new Set(prev.map((item) => item.id));
	return [...prev, ...next.filter((item) => !seen.has(item.id))];
}
