'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Search } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatusChip } from '@/features/polls/components/StatusChip';
import type { Poll, TagDto } from '@/features/polls/schema';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'open' | 'ended';
type Sort = 'newest' | 'popular' | 'ending';

/** Filters, sorts and searches the polls the server loaded; the API has no search yet. */
export function filterPolls(polls: Poll[], query: string, filter: Filter, sort: Sort, now = Date.now()) {
	const needle = query.trim().toLowerCase();
	const matches = polls.filter((poll) => {
		const status = derivePollStatus(poll, now);
		if (filter === 'open' && (status === 'ended' || status === 'scheduled')) return false;
		if (filter === 'ended' && status !== 'ended') return false;
		if (!needle) return true;
		return [poll.title, poll.description ?? '', ...poll.options.map((o) => o.text)]
			.join(' ')
			.toLowerCase()
			.includes(needle);
	});

	const endsAt = (poll: Poll) => (poll.endTime ? Date.parse(poll.endTime) : Infinity);
	return [...matches].sort((a, b) => {
		if (sort === 'popular') return (getTurnout(b) ?? 0) - (getTurnout(a) ?? 0);
		if (sort === 'ending') return endsAt(a) - endsAt(b);
		return Date.parse(b.createdAt) - Date.parse(a.createdAt);
	});
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
				active
					? 'border-foreground/40 bg-foreground/10 text-foreground'
					: 'border-border text-muted-foreground hover:text-foreground'
			)}
		>
			{children}
		</button>
	);
}

export function ExploreView({ polls, tags }: { polls: Poll[]; tags: TagDto[] }) {
	const { t } = useLanguage();
	const [query, setQuery] = useState('');
	const [filter, setFilter] = useState<Filter>('all');
	const [sort, setSort] = useState<Sort>('newest');
	const results = useMemo(() => filterPolls(polls, query, filter, sort), [polls, query, filter, sort]);

	return (
		<div className="px-contain mx-auto max-w-2xl space-y-8 py-6">
			<h1 className="text-4xl text-foreground">{t('explore.title')}</h1>

			{tags.length > 0 && (
				<section aria-labelledby="explore-topics" className="space-y-3">
					<h2 id="explore-topics" className="text-sm font-semibold">
						{t('explore.topics')}
					</h2>
					<ul className="flex flex-wrap gap-2">
						{tags.map((tag) => (
							<li key={tag.id}>
								<Link
									href={`/?tag=${encodeURIComponent(tag.slug)}`}
									className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40"
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
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t('explore.searchPlaceholder')}
						aria-label={t('explore.searchPlaceholder')}
						className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
					/>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex gap-1.5" role="group" aria-label={t('explore.status')}>
						<Pill active={filter === 'all'} onClick={() => setFilter('all')}>{t('explore.filterAll')}</Pill>
						<Pill active={filter === 'open'} onClick={() => setFilter('open')}>{t('explore.filterActive')}</Pill>
						<Pill active={filter === 'ended'} onClick={() => setFilter('ended')}>{t('explore.filterEnded')}</Pill>
					</div>
					<div className="flex gap-1.5" role="group" aria-label={t('explore.sort')}>
						<Pill active={sort === 'newest'} onClick={() => setSort('newest')}>{t('explore.sortNewest')}</Pill>
						<Pill active={sort === 'popular'} onClick={() => setSort('popular')}>{t('explore.sortMostVotes')}</Pill>
						<Pill active={sort === 'ending'} onClick={() => setSort('ending')}>{t('explore.sortEnding')}</Pill>
					</div>
				</div>

				{results.length === 0 ? (
					<p className="py-12 text-center text-sm text-muted-foreground">{t('explore.noResults')}</p>
				) : (
					<ul className="space-y-2.5">
						{results.map((poll) => (
							<li key={poll.id}>
								<Link
									href={`/poll/${poll.id}`}
									className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
								>
									<div className="flex items-start justify-between gap-3">
										<p className="flex-1 leading-snug text-foreground">{poll.title}</p>
										<StatusChip status={derivePollStatus(poll)} poll={poll} />
									</div>
									<p className="mt-2 text-xs tabular-nums text-muted-foreground">
										{t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })} · {poll.creatorUsername}
									</p>
								</Link>
							</li>
						))}
					</ul>
				)}
				<p className="text-center text-xs text-muted-foreground">{t('explore.recentOnly')}</p>
			</section>
		</div>
	);
}
