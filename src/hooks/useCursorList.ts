'use client';

import { useCallback, useState } from 'react';

import { type CursorPage, mergeById } from '@/lib/api/cursor';

/**
 * A cursor-paged list seeded with a server-rendered first page; a new
 * `initialPage` object (e.g. after a refresh) re-seeds it, so pass a stable
 * value, not an inline literal. `reset`
 * starts over with a new first page (e.g. after a filter changes: cursors
 * are bound to their query and must not be reused).
 */
export function useCursorList<T extends { id: string }>(
	initialPage: CursorPage<T> | null,
	fetchPage: (cursor: string) => Promise<CursorPage<T>>
) {
	const [items, setItems] = useState(initialPage?.items ?? []);
	const [nextCursor, setNextCursor] = useState(initialPage?.nextCursor ?? null);
	const [isLoading, setIsLoading] = useState(false);
	const [loadFailed, setLoadFailed] = useState(false);

	// A fresh server render (refresh, revalidation) brings a new first page
	const [seed, setSeed] = useState(initialPage);
	if (initialPage !== seed) {
		setSeed(initialPage);
		setItems(initialPage?.items ?? []);
		setNextCursor(initialPage?.nextCursor ?? null);
		setLoadFailed(false);
	}

	const loadMore = useCallback(async () => {
		if (isLoading || !nextCursor) return;
		setIsLoading(true);
		setLoadFailed(false);
		try {
			const page = await fetchPage(nextCursor);
			setItems((prev) => mergeById(prev, page.items));
			setNextCursor(page.nextCursor);
		} catch {
			setLoadFailed(true);
		} finally {
			setIsLoading(false);
		}
	}, [fetchPage, isLoading, nextCursor]);

	const reset = useCallback((page: CursorPage<T>) => {
		setItems(page.items);
		setNextCursor(page.nextCursor);
		setLoadFailed(false);
	}, []);

	return { items, setItems, hasMore: !!nextCursor, isLoading, loadFailed, loadMore, reset };
}
