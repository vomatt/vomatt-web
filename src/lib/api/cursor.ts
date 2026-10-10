import { z } from 'zod';

/** One page of a list endpoint. A null `nextCursor` means the last page. */
export type CursorPage<T> = { items: T[]; nextCursor: string | null };

/** The API's `CursorResponse<T>`: `{ items, nextCursor }`, no totals, no page jumps. */
export function cursorPageSchema<T extends z.ZodTypeAny>(item: T) {
	return z
		.object({ items: z.array(item), nextCursor: z.string().nullish() })
		.transform((page) => ({
			items: page.items,
			nextCursor: page.nextCursor ?? null,
		})) as unknown as z.ZodType<CursorPage<z.output<T>>>;
}

/** Query string for a list request; the first page sends no cursor. */
export function pageParams(cursor: string | null | undefined, limit: number) {
	const params = new URLSearchParams({ limit: String(limit) });
	if (cursor) params.set('cursor', cursor);
	return params;
}

/** Appends `next` to `prev`, dropping items whose id is already present. */
export function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
	const seen = new Set(prev.map((item) => item.id));
	return [...prev, ...next.filter((item) => !seen.has(item.id))];
}
