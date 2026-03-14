'use client';
import { Search } from '@/components/ui/icons';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { Poll } from '@/types/poll';

type Status = 'all' | 'active' | 'ended';
type SortBy = 'newest' | 'mostVotes';

function PollSearchCard({ poll }: { poll: Poll }) {
	const isActive = poll.active && poll.votingActive;
	return (
		<Link href={`/poll/${poll.id}`}>
			<div className="group p-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200">
				<div className="flex items-start justify-between gap-3">
					<p className="font-display text-lg leading-snug text-foreground group-hover:text-foreground/80 transition-colors flex-1">
						{poll.title}
					</p>
					<span
						className={cn(
							'text-xs px-2.5 py-0.5 rounded-full font-medium border shrink-0',
							isActive
								? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
								: 'border-border/50 text-muted-foreground bg-muted/30'
						)}
					>
						{isActive ? 'Active' : 'Ended'}
					</span>
				</div>
				{poll.description && (
					<p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
						{poll.description}
					</p>
				)}
				<p className="font-data text-xs text-muted-foreground mt-2.5 tabular-nums">
					{poll.totalVotes.toLocaleString()} votes · {poll.creatorUsername}
				</p>
			</div>
		</Link>
	);
}

export default function ExplorePage() {
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<Status>('all');
	const [sort, setSort] = useState<SortBy>('newest');
	const [polls, setPolls] = useState<Poll[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchPolls = (q: string, s: Status, sortBy: SortBy) => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			setIsLoading(true);
			try {
				const params = new URLSearchParams({ sort: sortBy, status: s });
				if (q) params.set('q', q);
				const res = await fetch(`/api/search-polls?${params}`);
				const json = await res.json();
				if (json?.data?.content) setPolls(json.data.content);
			} finally {
				setIsLoading(false);
			}
		}, 300);
	};

	useEffect(() => {
		fetchPolls(query, status, sort);
	}, [query, status, sort]);

	const statusFilters: { label: string; value: Status }[] = [
		{ label: 'All', value: 'all' },
		{ label: 'Active', value: 'active' },
		{ label: 'Ended', value: 'ended' },
	];

	const sortOptions: { label: string; value: SortBy }[] = [
		{ label: 'Newest', value: 'newest' },
		{ label: 'Most Votes', value: 'mostVotes' },
	];

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="font-display text-4xl text-foreground mb-6">Explore</h1>

			{/* Search input */}
			<div className="relative mb-4">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search polls…"
					className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500/40 focus:bg-amber-500/5 transition-all text-sm"
				/>
			</div>

			{/* Filters */}
			<div className="flex items-center justify-between gap-4 mb-6">
				<div className="flex gap-1.5">
					{statusFilters.map(({ label, value }) => (
						<button
							key={value}
							onClick={() => setStatus(value)}
							className={cn(
								'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
								status === value
									? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
									: 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-card'
							)}
						>
							{label}
						</button>
					))}
				</div>
				<div className="flex gap-1.5">
					{sortOptions.map(({ label, value }) => (
						<button
							key={value}
							onClick={() => setSort(value)}
							className={cn(
								'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
								sort === value
									? 'border-foreground/40 text-foreground bg-foreground/10'
									: 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground bg-card'
							)}
						>
							{label}
						</button>
					))}
				</div>
			</div>

			{/* Results */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Spinner />
				</div>
			) : polls.length === 0 ? (
				<p className="text-muted-foreground text-center py-12 text-sm">
					No polls found.
				</p>
			) : (
				<div className="space-y-2.5">
					{polls.map((poll) => (
						<PollSearchCard key={poll.id} poll={poll} />
					))}
				</div>
			)}
		</div>
	);
}
