'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadMore } from '@/components/LoadMore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Search } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { EXPLORE_PAGE_SIZE, SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from '@/features/polls/constants';
import type { Poll, TagDto } from '@/features/polls/schema';
import { getPolls, type PollListQuery } from '@/features/polls/service';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { topicHref } from '@/lib/routes';

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
			className="rounded-full px-4"
		>
			{children}
		</Button>
	);
}

export function ExploreView({
	initialPage,
	tags,
}: {
	/** Open Polls, newest first; null when the API couldn't be reached. */
	initialPage: CursorPage<Poll> | null;
	tags: TagDto[];
}) {
	const { t } = useLanguage();
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<Status>('open');
	const [sort, setSort] = useState<Sort>('newest');
	const [isSearching, setIsSearching] = useState(false);
	const [searchFailed, setSearchFailed] = useState(initialPage === null);

	// Memoized on its fields, so keystrokes that don't change the query don't refetch
	const { sort: apiSort, q } = toExploreQuery(query, status, sort);
	const apiQuery = useMemo(() => ({ status, sort: apiSort, q }), [status, apiSort, q]);
	const fetchPage = useCallback(
		(cursor: string) => getPolls(apiQuery, cursor, EXPLORE_PAGE_SIZE),
		[apiQuery]
	);
	const list = useCursorList(initialPage, fetchPage);
	const { reset } = list;

	// A new query starts from its own first page; typing waits for a pause.
	// The server already rendered the first page of the initial query.
	const initialQuery = useRef(apiQuery);
	useEffect(() => {
		if (apiQuery === initialQuery.current) return;
		let ignore = false;
		const timer = setTimeout(async () => {
			setIsSearching(true);
			try {
				const page = await getPolls(apiQuery, null, EXPLORE_PAGE_SIZE);
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
	}, [apiQuery, reset]);

	return (
		<div className="space-y-8">
			<h1 className="display-heading text-[32px] text-foreground md:text-[44px]">{t('explore.title')}</h1>

			{tags.length > 0 && (
				<section aria-labelledby="explore-topics" className="space-y-3">
					<h2 id="explore-topics" className="text-sm font-semibold">
						{t('explore.topics')}
					</h2>
					<ul className="flex flex-wrap gap-2">
						{tags.map((tag) => (
							<li key={tag.id}>
								<Link
									href={topicHref(tag.slug)}
									className="flex min-h-10 items-center gap-2 rounded-full bg-secondary px-3.5 text-sm transition-colors hover:bg-border-strong"
								>
									#{tag.name}
									{tag.usageCount !== undefined && (
										<span className="font-mono text-xs text-muted-foreground">{tag.usageCount}</span>
									)}
								</Link>
							</li>
						))}
					</ul>
				</section>
			)}

			<section className="space-y-4">
				<div className="relative">
					<Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t('explore.searchPlaceholder')}
						aria-label={t('explore.searchPlaceholder')}
						className="pl-10 pr-4 md:text-[15px]"
					/>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex gap-1.5" role="group" aria-label={t('explore.status')}>
						<Pill active={status === 'open'} onClick={() => setStatus('open')}>{t('explore.filterActive')}</Pill>
						<Pill active={status === 'ended'} onClick={() => setStatus('ended')}>{t('explore.filterEnded')}</Pill>
					</div>
					{status === 'open' && (
						<div className="flex gap-1.5" role="group" aria-label={t('explore.sort')}>
							<Pill active={sort === 'newest'} onClick={() => setSort('newest')}>{t('explore.sortNewest')}</Pill>
							<Pill active={sort === 'closing'} onClick={() => setSort('closing')}>{t('explore.sortEnding')}</Pill>
							<Pill active={sort === 'top'} onClick={() => setSort('top')}>{t('explore.sortTop')}</Pill>
						</div>
					)}
				</div>

				{isSearching ? (
					<div className="flex justify-center py-12">
						<Spinner />
					</div>
				) : searchFailed ? (
					<p className="py-12 text-center text-sm text-muted-foreground">{t('explore.loadFailed')}</p>
				) : list.items.length === 0 ? (
					<p className="py-12 text-center text-sm text-muted-foreground">{t('explore.noResults')}</p>
				) : (
					<ul className="space-y-2">
						{list.items.map((poll) => (
							<PollListItem
								key={poll.id}
								poll={poll}
								meta={
									<span className="inline-flex gap-1.5">
										<span>{t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })}</span>
										<span>{poll.creatorUsername}</span>
									</span>
								}
								aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
							/>
						))}
					</ul>
				)}
				{!isSearching && !searchFailed && <LoadMore list={list} />}
				{query.trim().length > 0 && query.trim().length < SEARCH_MIN_LENGTH && (
					<p className="text-center text-xs text-muted-foreground">{t('explore.searchTooShort')}</p>
				)}
			</section>
		</div>
	);
}
