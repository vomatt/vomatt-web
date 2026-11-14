import { z } from 'zod';

/** One page of a list endpoint. A null `nextCursor` means the last page. */
export type CursorPage<T> = { items: T[]; nextCursor: string | null };

/**
 * The items that pass `item`. The ones that fail are left out and logged once per page; a page where
 * every item fails throws, so a list the app can't read shows as failed, not as empty.
 */
function keepValid<T extends z.ZodTypeAny>(item: T) {
	return (raws: unknown[]): z.output<T>[] => {
		const results = raws.map((raw) => item.safeParse(raw));
		const failed = results.flatMap((result, i) => (result.success ? [] : [{ raw: raws[i], error: result.error }]));
		if (failed.length === 0) return results.map((result) => result.data);
		if (failed.length === raws.length) throw failed[0].error;
		// Ids and the first item's issues only: the items themselves may hold personal data
		console.error(`Left out ${failed.length} of ${raws.length} list items that failed validation:`, {
			ids: failed.map(({ raw }) => (raw as { id?: unknown } | null)?.id),
			issues: failed[0].error.issues,
		});
		return results.flatMap((result) => (result.success ? [result.data] : []));
	};
}

/**
 * The API's `CursorResponse<T>`: `{ items, nextCursor }`, no totals, no page jumps.
 * `skipInvalid`: an item that fails validation is left out (see keepValid) instead of failing the list.
 * Only for lists where a missing row misleads nobody.
 */
export function cursorPageSchema<T extends z.ZodTypeAny>(item: T, { skipInvalid = false } = {}) {
	return z
		.object({
			items: skipInvalid ? z.array(z.unknown()).transform(keepValid(item)) : z.array(item),
			nextCursor: z.string().nullish(),
		})
		.transform((page) => ({
			items: page.items,
			nextCursor: page.nextCursor ?? null,
		})) as unknown as z.ZodType<CursorPage<z.output<T>>>;
}

/** The API clamps `limit` to 1–50; clamp here too so callers can't ask for more. */
export const MAX_PAGE_SIZE = 50;

/** Query string for a list request; the first page sends no cursor. */
export function pageParams(cursor: string | null | undefined, limit: number) {
	const clamped = Math.min(Math.max(1, Math.floor(limit) || 1), MAX_PAGE_SIZE);
	const params = new URLSearchParams({ limit: String(clamped) });
	if (cursor) params.set('cursor', cursor);
	return params;
}

/** Appends `next` to `prev`, dropping items whose id is already present (in either). */
export function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
	const seen = new Set(prev.map((item) => item.id));
	return [
		...prev,
		...next.filter((item) => {
			if (seen.has(item.id)) return false;
			seen.add(item.id);
			return true;
		}),
	];
}

/**
 * Reads pages from `cursor` (null: the first page) until the last page,
 * `until(items)` holds, or `maxPages` were read. A non-null `nextCursor`
 * in the result means more pages remain.
 */
export async function collectPages<T>(
	fetchPage: (cursor: string | null) => Promise<CursorPage<T>>,
	{
		cursor = null,
		maxPages,
		until,
	}: { cursor?: string | null; maxPages: number; until?: (items: T[]) => boolean }
): Promise<CursorPage<T> & { pages: number }> {
	const items: T[] = [];
	let next = cursor;
	let pages = 0;
	while (pages < maxPages) {
		const page = await fetchPage(next);
		items.push(...page.items);
		next = page.nextCursor;
		pages++;
		if (!next || until?.(items)) break;
	}
	return { items, nextCursor: next, pages };
}
