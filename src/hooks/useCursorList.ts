'use client';

import { useCallback, useState } from 'react';

import { type CursorPage, mergeById } from '@/lib/api/cursor';

/**
 * A cursor-paged list seeded with a server-rendered first page; a new
 * `initialPage` object (e.g. after a refresh) re-seeds it, so pass a stable
 * value, not an inline literal. `reset` starts over with a new first page
 * (e.g. after a filter changes). A cursor only works for the query that
 * issued it, so Load more keeps using the `fetchPage` of the listed pages
 * until a seed or `reset` replaces them.
 */
export function useCursorList<T extends { id: string }>(
	initialPage: CursorPage<T> | null,
	fetchPage: (cursor: string) => Promise<CursorPage<T>>
) {
	const [items, setItems] = useState(initialPage?.items ?? []);
	const [nextCursor, setNextCursor] = useState(initialPage?.nextCursor ?? null);
	const [isLoading, setIsLoading] = useState(false);
	const [loadFailed, setLoadFailed] = useState(false);
	const [fetchListed, setFetchListed] = useState(() => fetchPage);

	// A fresh server render (refresh, revalidation) brings a new first page
	const [seed, setSeed] = useState(initialPage);
	if (initialPage !== seed) {
		setSeed(initialPage);
		setItems(initialPage?.items ?? []);
		setNextCursor(initialPage?.nextCursor ?? null);
		setLoadFailed(false);
		setFetchListed(() => fetchPage);
	}

	const loadMore = useCallback(async () => {
		if (isLoading || !nextCursor) return;
		setIsLoading(true);
		setLoadFailed(false);
		try {
			const page = await fetchListed(nextCursor);
			setItems((prev) => mergeById(prev, page.items));
			setNextCursor(page.nextCursor);
		} catch {
			setLoadFailed(true);
		} finally {
			setIsLoading(false);
		}
	}, [fetchListed, isLoading, nextCursor]);

	const reset = useCallback(
		(page: CursorPage<T>) => {
			setItems(page.items);
			setNextCursor(page.nextCursor);
			setLoadFailed(false);
			setFetchListed(() => fetchPage);
		},
		[fetchPage]
	);

	return { items, setItems, hasMore: !!nextCursor, isLoading, loadFailed, loadMore, reset };
}
