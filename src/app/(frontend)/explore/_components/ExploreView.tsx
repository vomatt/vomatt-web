'use client';

import { Suspense, use, useCallback, useEffect, useId, useMemo, useState } from 'react';

import { EmptyCard } from '@/components/EmptyCard';
import { LoadMore } from '@/components/LoadMore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollCard } from '@/features/polls/components/PollCard';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { EXPLORE_PAGE_SIZE, SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/features/polls/constants';
import type { Poll } from '@/features/polls/schema';
import { getPolls, type PollListQuery } from '@/features/polls/service';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { cn } from '@/lib/utils';

type Status = 'open' | 'ended';
type Sort = 'newest' | 'closing' | 'top';

/** The query sent to the API; a search under the minimum length is no search. */
export function toExploreQuery(query: string, status: Status, sort: Sort): PollListQuery {
	const q = query.trim();
	return {
		status,
		// Ended Polls have a fixed order; the API rejects a sort for them
		sort: status === 'open' ? sort : undefined,
		q: q.length >= SEARCH_MIN_LENGTH ? q : undefined,
	};
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
	viewerId,
	anonymousByDefault,
}: {
	/** Open Polls, newest first; null when the API couldn't be reached. */
	initialPage: Promise<CursorPage<Poll> | null>;
	viewerId?: string;
	anonymousByDefault?: boolean;
}) {
	const { t } = useLanguage();
	const searchId = useId();
	const statusLabelId = useId();
	const sortLabelId = useId();
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<Status>('open');
	const [sort, setSort] = useState<Sort>('newest');

	// Memoized on its fields, so keystrokes that don't change the query don't refetch
	const { sort: apiSort, q } = toExploreQuery(query, status, sort);
	const apiQuery = useMemo(() => ({ status, sort: apiSort, q }), [status, apiSort, q]);
	// The query the server's first page answers
	const [initialQuery] = useState(apiQuery);

	return (
		<div className="mx-auto flex max-w-feed flex-col gap-4">
			<h1 className="page-title text-foreground">{t('explore.title')}</h1>

			<div className="flex flex-col gap-3">
				<label htmlFor={searchId} className="sr-only">
					{t('explore.searchLabel')}
				</label>
				<Input
					id={searchId}
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder={t('explore.searchPlaceholder')}
					className="bg-card px-4 md:text-base"
				/>

				<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
					<div className="flex items-center gap-4">
						<span id={statusLabelId} className="text-[13px] text-muted-foreground">
							{t('explore.status')}
						</span>
						<div className="flex gap-2" role="group" aria-labelledby={statusLabelId}>
							<Pill active={status === 'open'} onClick={() => setStatus('open')}>{t('explore.filterActive')}</Pill>
							<Pill active={status === 'ended'} onClick={() => setStatus('ended')}>{t('explore.filterEnded')}</Pill>
						</div>
					</div>
					{/* Hidden, not removed, for Ended Polls: the row keeps its height when it wraps */}
					<div className={cn('flex items-center gap-4', status !== 'open' && 'invisible')}>
						<span id={sortLabelId} className="text-[13px] text-muted-foreground">
							{t('explore.sort')}
						</span>
						<div className="flex gap-2" role="group" aria-labelledby={sortLabelId}>
							<Pill active={sort === 'newest'} onClick={() => setSort('newest')}>{t('explore.sortNewest')}</Pill>
							<Pill active={sort === 'closing'} onClick={() => setSort('closing')}>{t('explore.sortEnding')}</Pill>
							<Pill active={sort === 'top'} onClick={() => setSort('top')}>{t('explore.sortTop')}</Pill>
						</div>
					</div>
				</div>
			</div>

			{/* Filters and search render at once; only the results wait for the server */}
			<Suspense fallback={<PollListSkeleton />}>
				<ExploreResults
					initialPage={initialPage}
					initialQuery={initialQuery}
					apiQuery={apiQuery}
					status={status}
					viewerId={viewerId}
					anonymousByDefault={anonymousByDefault}
				/>
			</Suspense>
			{query.trim().length > 0 && query.trim().length < SEARCH_MIN_LENGTH && (
				<p className="text-center text-xs text-muted-foreground">{t('explore.searchTooShort')}</p>
			)}
		</div>
	);
}

/** The listed Polls for `apiQuery`; a new query starts from its own first page. */
function ExploreResults({
	initialPage,
	initialQuery,
	apiQuery,
	status,
	viewerId,
	anonymousByDefault,
}: {
	initialPage: Promise<CursorPage<Poll> | null>;
	/** The query `initialPage` answers, so it isn't fetched again. */
	initialQuery: PollListQuery;
	apiQuery: PollListQuery;
	/** The status picked, so an empty result suggests the other one. */
	status: Status;
	viewerId?: string;
	anonymousByDefault?: boolean;
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
					<p className="py-12 text-center text-sm text-muted-foreground">{t('explore.loadFailed')}</p>
				) : list.items.length === 0 ? (
					<EmptyCard
						title={t('explore.noResults')}
						body={t(status === 'open' ? 'explore.noResultsHint' : 'explore.noResultsHintEnded')}
					/>
				) : (
					<div className="flex flex-col gap-4">
						{list.items.map((poll) => (
							<PollCard key={poll.id} poll={poll} viewerId={viewerId} anonymousByDefault={anonymousByDefault} />
						))}
					</div>
				)}
			</div>
			{!isSearching && !searchFailed && <LoadMore list={list} />}
		</>
	);
}
