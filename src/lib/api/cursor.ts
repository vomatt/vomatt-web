import { z } from 'zod';

/**
 * One page of a list endpoint. A null `nextCursor` means the last page.
 * The cursor is the next page number, kept opaque to callers.
 */
export type CursorPage<T> = { items: T[]; nextCursor: string | null };

/** The API's `PageResponse<T>`: `{ content, total, page, limit }`, `page` 1-based. */
export function cursorPageSchema<T extends z.ZodTypeAny>(item: T) {
	return z
		.object({
			content: z.array(item),
			total: z.number().int(),
			page: z.number().int(),
			limit: z.number().int(),
		})
		.transform((page) => ({
			items: page.content,
			nextCursor:
				page.limit > 0 && page.page * page.limit < page.total ? String(page.page + 1) : null,
		})) as unknown as z.ZodType<CursorPage<z.output<T>>>;
}

/** An empty page, e.g. a fallback when a list can't be loaded. */
export const EMPTY_PAGE: CursorPage<never> = { items: [], nextCursor: null };

/** Clamp the page size so callers can't ask for more than this. */
export const MAX_PAGE_SIZE = 50;

/** Query string for a list request (Spring `Pageable`); no cursor means page 1. */
export function pageParams(cursor: string | null | undefined, limit: number) {
	const clamped = Math.min(Math.max(1, Math.floor(limit) || 1), MAX_PAGE_SIZE);
	return new URLSearchParams({ page: cursor || '1', size: String(clamped) });
}

/** Appends `next` to `prev`, dropping items whose id is already present. */
export function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
	const seen = new Set(prev.map((item) => item.id));
	return [...prev, ...next.filter((item) => !seen.has(item.id))];
}
