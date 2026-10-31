'use client';

import { memo, Suspense, use, useCallback, useEffect, useId, useMemo, useState } from 'react';

import { EmptyCard } from '@/components/EmptyCard';
import { LoadMore } from '@/components/LoadMore';
import { StickyBar } from '@/components/StickyBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollTileGridSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { PollTile, PollTileGrid } from '@/features/polls/components/PollTile';
import { EXPLORE_PAGE_SIZE, SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/features/polls/constants';
import type { Poll, TagDto } from '@/features/polls/schema';
import { getPolls, type PollListQuery } from '@/features/polls/service';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { cn } from '@/lib/utils';

type Status = 'open' | 'ended';
type Sort = 'newest' | 'closing' | 'top';

/** The query sent to the API; a search under the minimum length is no search. */
export function toExploreQuery(query: string, status: Status, sort: Sort, tag?: string): PollListQuery {
	const q = query.trim();
	return {
		status,
		// Ended Polls have a fixed order; the API rejects a sort for them
		sort: status === 'open' ? sort : undefined,
		q: q.length >= SEARCH_MIN_LENGTH ? q : undefined,
		tag,
	};
}

const TOPIC_LIMIT = 8;

/**
 * The topics to offer from `topics` (most used first): those whose name or slug contains the
 * search, or the most used ones without a search. `q` is already trimmed and long enough, or undefined.
 */
export function topicsFor(topics: TagDto[], q: string | undefined): TagDto[] {
	const needle = q?.toLocaleLowerCase();
	const matches = needle
		? topics.filter((tag) => tag.name.toLocaleLowerCase().includes(needle) || tag.slug.includes(needle))
		: topics;
	return matches.slice(0, TOPIC_LIMIT);
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
	return (
		<Button
			type="button"
			size="sm"
			variant={active ? 'default' : 'outline'}
			aria-pressed={active}
			onClick={onClick}
			className="rounded-full px-3.5"
		>
			{children}
		</Button>
	);
}

export function ExploreView({
	initialPage,
	topics,
}: {
	/** Open Polls, newest first; null when the API couldn't be reached. */
	initialPage: Promise<CursorPage<Poll> | null>;
	/** Every topic, most used first; empty when the API couldn't be reached. */
	topics: TagDto[];
}) {
	const { t } = useLanguage();
	const searchId = useId();
	const statusLabelId = useId();
	const sortLabelId = useId();
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<Status>('open');
	const [sort, setSort] = useState<Sort>('newest');
	const [tag, setTag] = useState<string>();

	// Memoized on its fields, so keystrokes that don't change the query don't refetch
	const { sort: apiSort, q, tag: apiTag } = toExploreQuery(query, status, sort, tag);
	const apiQuery = useMemo(() => ({ status, sort: apiSort, q, tag: apiTag }), [status, apiSort, q, apiTag]);
	// The query the server's first page answers
	const [initialQuery] = useState(apiQuery);

	// A topic the search found replaces the search: the grid then shows that topic's Polls
	const pickTopic = (slug: string) => {
		if (slug === tag) return setTag(undefined);
		setTag(slug);
		if (q) setQuery('');
	};

	return (
		<div className="flex flex-col gap-4">
			<h1 className="sr-only">{t('explore.title')}</h1>

			<StickyBar className="-mx-1 flex flex-col gap-3 px-1 py-2">
				<label htmlFor={searchId} className="sr-only">
					{t('explore.searchLabel')}
				</label>
				<Input
					id={searchId}
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t('explore.searchPlaceholder')}
					className="bg-card px-4"
				/>

				<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
					<div className="flex items-center gap-4">
						<span id={statusLabelId} className="text-caption-1 text-muted-foreground">
							{t('explore.status')}
						</span>
						<div className="flex gap-2" role="group" aria-labelledby={statusLabelId}>
							<Pill active={status === 'open'} onClick={() => setStatus('open')}>{t('explore.filterActive')}</Pill>
							<Pill active={status === 'ended'} onClick={() => setStatus('ended')}>{t('explore.filterEnded')}</Pill>
						</div>
					</div>
					{/* Hidden, not removed, for Ended Polls: the row keeps its height when it wraps */}
					<div className={cn('flex items-center gap-4', status !== 'open' && 'invisible')}>
						<span id={sortLabelId} className="text-caption-1 text-muted-foreground">
							{t('explore.sort')}
						</span>
						<div className="flex gap-2" role="group" aria-labelledby={sortLabelId}>
							<Pill active={sort === 'newest'} onClick={() => setSort('newest')}>{t('explore.sortNewest')}</Pill>
							<Pill active={sort === 'closing'} onClick={() => setSort('closing')}>{t('explore.sortEnding')}</Pill>
							<Pill active={sort === 'top'} onClick={() => setSort('top')}>{t('explore.sortTop')}</Pill>
						</div>
					</div>
				</div>
			</StickyBar>
			{/* Under the bar, not in it: a fourth stuck row would cover too much of a phone */}
			<TopicPills topics={topics} q={q} activeTag={tag} onPick={pickTopic} />

			{/* Filters and search render at once; only the results wait for the server */}
			<Suspense fallback={<PollTileGridSkeleton />}>
				<ExploreResults initialPage={initialPage} initialQuery={initialQuery} apiQuery={apiQuery} status={status} />
			</Suspense>
			{query.trim().length > 0 && query.trim().length < SEARCH_MIN_LENGTH && (
				<p className="text-center text-caption-3 text-muted-foreground">{t('explore.searchTooShort')}</p>
			)}
		</div>
	);
}

/** Topic toggles: the ones the search matches, or the most used; the picked one stays first. */
function TopicPills({
	topics,
	q,
	activeTag,
	onPick,
}: {
	topics: TagDto[];
	q: string | undefined;
	activeTag: string | undefined;
	onPick: (slug: string) => void;
}) {
	const { t } = useLanguage();
	const labelId = useId();
	const active = topics.find((tag) => tag.slug === activeTag);
	const rest = topicsFor(topics, q).filter((tag) => tag !== active);
	const shown = active ? [active, ...rest] : rest;
	if (shown.length === 0) return null;

	return (
		<div className="flex items-center gap-4">
			<span id={labelId} className="shrink-0 text-caption-1 text-muted-foreground">
				{t('explore.topics')}
			</span>
			{/* Padded inside the scroller, so the end pills' focus rings aren't clipped */}
			<ul aria-labelledby={labelId} className="-m-1 flex gap-2 overflow-x-auto p-1 scrollbar-none">
				{shown.map((tag) => (
					<li key={tag.id} className="shrink-0">
						<Pill active={tag === active} onClick={() => onPick(tag.slug)}>{tag.name}</Pill>
					</li>
				))}
			</ul>
		</div>
	);
}

/**
 * The listed Polls for `apiQuery`; a new query starts from its own first page. Memoized, so
 * keystrokes that don't change the query don't re-render every tile.
 */
const ExploreResults = memo(function ExploreResults({
	initialPage,
	initialQuery,
	apiQuery,
	status,
}: {
	initialPage: Promise<CursorPage<Poll> | null>;
	/** The query `initialPage` answers, so it isn't fetched again. */
	initialQuery: PollListQuery;
	apiQuery: PollListQuery;
	/** The status picked, so an empty result suggests the other one. */
	status: Status;
}) {
	const { t } = useLanguage();
	const firstPage = use(initialPage);
	const [isSearching, setIsSearching] = useState(false);
	const [searchFailed, setSearchFailed] = useState(firstPage === null);
	const fetchPage = useCallback(
		(cursor: string) => getPolls(apiQuery, cursor, EXPLORE_PAGE_SIZE, { asViewer: true }),
		[apiQuery]
	);
	const list = useCursorList(firstPage, fetchPage);
	const { reset } = list;

	// Typing waits for a pause. A filter changed before the first page arrived
	// differs from `initialQuery`, so it's fetched on mount.
	useEffect(() => {
		if (apiQuery === initialQuery) return;
		let ignore = false;
		const timer = setTimeout(async () => {
			setIsSearching(true);
			try {
				const page = await getPolls(apiQuery, null, EXPLORE_PAGE_SIZE, { asViewer: true });
				if (ignore) return;
				reset(page);
				setSearchFailed(false);
			} catch {
				if (!ignore) setSearchFailed(true);
			} finally {
				if (!ignore) setIsSearching(false);
			}
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			ignore = true;
			clearTimeout(timer);
		};
	}, [apiQuery, initialQuery, reset]);

	return (
		<>
			{/* The previous results stay, dimmed, until the new ones arrive */}
			<div
				aria-busy={isSearching}
				inert={isSearching}
				className={cn('transition-opacity', isSearching && 'opacity-50')}
			>
				{searchFailed ? (
					<p className="py-12 text-center text-caption-1 text-muted-foreground">{t('explore.loadFailed')}</p>
				) : list.items.length === 0 ? (
					<EmptyCard
						title={t('explore.noResults')}
						body={t(
							// A topic with no search is what emptied the grid, so point at it
							apiQuery.tag && !apiQuery.q
								? 'explore.noResultsHintTopic'
								: status === 'open'
									? 'explore.noResultsHint'
									: 'explore.noResultsHintEnded'
						)}
					/>
				) : (
					<PollTileGrid>
						{list.items.map((poll) => (
							<PollTile key={poll.id} poll={poll} />
						))}
					</PollTileGrid>
				)}
			</div>
			{!isSearching && !searchFailed && <LoadMore list={list} />}
		</>
	);
});
