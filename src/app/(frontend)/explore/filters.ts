import { isSearchable } from '@/features/polls/constants';
import type { PollListQuery } from '@/features/polls/service';

export type ExploreStatus = 'open' | 'ended';
export type ExploreSort = 'newest' | 'closing' | 'top';

/** What the viewer picked: the search as typed, the status, the sort and the topic slug. */
export type ExploreFilters = { query: string; status: ExploreStatus; sort: ExploreSort; tag?: string };

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = { query: '', status: 'open', sort: 'newest' };

const SORTS: readonly ExploreSort[] = ['newest', 'closing', 'top'];

/** The query sent to the API; a search under the minimum length is no search. */
export function toExploreQuery(query: string, status: ExploreStatus, sort: ExploreSort, tag?: string): PollListQuery {
	const q = query.trim();
	return {
		status,
		// Ended Polls have a fixed order; the API rejects a sort for them
		sort: status === 'open' ? sort : undefined,
		q: isSearchable(q) ? q : undefined,
		tag,
	};
}

/** The filters in the address (`?q=&status=&sort=&tag=`); unknown values fall back to the defaults. */
export function filtersFromParams(params: Record<string, string | string[] | undefined>): ExploreFilters {
	// A repeated parameter arrives as an array
	const first = (key: string) => [params[key]].flat()[0];
	const sort = first('sort');
	return {
		query: first('q') ?? '',
		status: first('status') === 'ended' ? 'ended' : 'open',
		sort: SORTS.find((s) => s === sort) ?? 'newest',
		tag: first('tag') || undefined,
	};
}

/**
 * The address's search string for an API query: only what differs from the default list, or ''.
 * Parameters in `current` that aren't filters (a campaign tag, say) are kept.
 */
export function toExploreSearch({ status, sort, tag, q }: PollListQuery, current = ''): string {
	const params = new URLSearchParams(current);
	for (const key of ['status', 'sort', 'tag', 'q']) params.delete(key);
	if (status === 'ended') params.set('status', 'ended');
	if (sort && sort !== 'newest') params.set('sort', sort);
	if (tag) params.set('tag', tag);
	if (q) params.set('q', q);
	const search = params.toString();
	return search ? `?${search}` : '';
}

/** Whether two API queries ask for the same list. */
export function sameQuery(a: PollListQuery, b: PollListQuery | null): boolean {
	return !!b && a.status === b.status && a.sort === b.sort && a.q === b.q && a.tag === b.tag;
}
