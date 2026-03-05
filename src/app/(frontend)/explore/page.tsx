'use client';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { Poll } from '@/types/poll';

type Status = 'all' | 'active' | 'ended';
type SortBy = 'newest' | 'mostVotes';

function PollSearchCard({ poll }: { poll: Poll }) {
	return (
		<Link href={`/poll/${poll.id}`}>
			<div className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
				<div className="flex items-start justify-between gap-2">
					<p className="font-semibold text-foreground hover:underline flex-1">
						{poll.title}
					</p>
					<span
						className={cn(
							'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
							poll.active && poll.votingActive
								? 'bg-green-100 text-green-800'
								: 'bg-muted text-muted-foreground'
						)}
					>
						{poll.active && poll.votingActive ? 'Active' : 'Ended'}
					</span>
				</div>
				{poll.description && (
					<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
						{poll.description}
					</p>
				)}
				<p className="text-xs text-muted-foreground mt-2">
					{poll.totalVotes} votes · by {poll.creatorUsername}
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
			<h1 className="text-2xl font-bold mb-6">Explore</h1>

			{/* Search input */}
			<div className="relative mb-4">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search polls..."
					className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			{/* Filters */}
			<div className="flex items-center justify-between gap-4 mb-6">
				<div className="flex gap-2">
					{statusFilters.map(({ label, value }) => (
						<Button
							key={value}
							size="sm"
							variant={status === value ? 'default' : 'outline'}
							onClick={() => setStatus(value)}
						>
							{label}
						</Button>
					))}
				</div>
				<div className="flex gap-2">
					{sortOptions.map(({ label, value }) => (
						<Button
							key={value}
							size="sm"
							variant={sort === value ? 'default' : 'outline'}
							onClick={() => setSort(value)}
						>
							{label}
						</Button>
					))}
				</div>
			</div>

			{/* Results */}
			{isLoading ? (
				<div className="flex justify-center py-12">
					<Spinner />
				</div>
			) : polls.length === 0 ? (
				<p className="text-muted-foreground text-center py-12">
					No polls found.
				</p>
			) : (
				<div className="space-y-3">
					{polls.map((poll) => (
						<PollSearchCard key={poll.id} poll={poll} />
					))}
				</div>
			)}
		</div>
	);
}
