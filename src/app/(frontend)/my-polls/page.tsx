'use client';
import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { Poll } from '@/types/poll';

type Tab = 'active' | 'drafts' | 'ended';

function PollRow({ poll }: { poll: Poll }) {
	const isActive = poll.active && poll.votingActive;
	return (
		<div className="group flex items-start justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200">
			<div className="flex-1 min-w-0">
				<Link href={`/poll/${poll.id}`}>
					<p className="font-display text-lg leading-snug text-foreground group-hover:text-foreground/80 transition-colors truncate">
						{poll.title}
					</p>
				</Link>
				<p className="font-data text-xs text-muted-foreground mt-1.5 tabular-nums">
					{poll.totalVotes.toLocaleString()} votes ·{' '}
					{formatDistance(new Date(poll.createdAt), new Date(), {
						locale: enUS,
					})}{' '}
					ago
				</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<span
					className={cn(
						'text-xs px-2.5 py-0.5 rounded-full font-medium border',
						isActive
							? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
							: 'border-border/50 text-muted-foreground bg-muted/30'
					)}
				>
					{isActive ? 'Active' : 'Ended'}
				</span>
			</div>
		</div>
	);
}

export default function MyPollsPage() {
	const [polls, setPolls] = useState<Poll[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<Tab>('active');

	useEffect(() => {
		fetch('/api/my-polls')
			.then((r) => r.json())
			.then((json) => {
				if (json?.data?.content) setPolls(json.data.content);
			})
			.finally(() => setIsLoading(false));
	}, []);

	const activePolls = polls.filter((p) => p.active && p.votingActive);
	const endedPolls = polls.filter((p) => !p.active || !p.votingActive);

	const tabContent: Record<Tab, Poll[]> = {
		active: activePolls,
		drafts: [],
		ended: endedPolls,
	};

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="font-display text-4xl text-foreground mb-6">My Polls</h1>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<Spinner />
				</div>
			) : (
				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
					<TabsList className="mb-4">
						<TabsTrigger value="active">
							Active ({activePolls.length})
						</TabsTrigger>
						<TabsTrigger value="drafts">Drafts</TabsTrigger>
						<TabsTrigger value="ended">Ended ({endedPolls.length})</TabsTrigger>
					</TabsList>

					{(['active', 'drafts', 'ended'] as Tab[]).map((tab) => (
						<TabsContent key={tab} value={tab} className="space-y-3">
							{tabContent[tab].length === 0 ? (
								<p className="text-muted-foreground text-center py-8">
									No polls here yet.
								</p>
							) : (
								tabContent[tab].map((poll) => (
									<PollRow key={poll.id} poll={poll} />
								))
							)}
						</TabsContent>
					))}
				</Tabs>
			)}
		</div>
	);
}
