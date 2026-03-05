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
	return (
		<div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
			<div className="flex-1 min-w-0">
				<Link href={`/poll/${poll.id}`}>
					<p className="font-semibold text-foreground hover:underline truncate">
						{poll.title}
					</p>
				</Link>
				<p className="text-xs text-muted-foreground mt-1">
					{poll.totalVotes} votes ·{' '}
					{formatDistance(new Date(poll.createdAt), new Date(), {
						locale: enUS,
					})}{' '}
					ago
				</p>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<span
					className={cn(
						'text-xs px-2 py-0.5 rounded-full font-medium',
						poll.active && poll.votingActive
							? 'bg-green-100 text-green-800'
							: 'bg-muted text-muted-foreground'
					)}
				>
					{poll.active && poll.votingActive ? 'Active' : 'Ended'}
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
			<h1 className="text-2xl font-bold mb-6">My Polls</h1>

			{isLoading ? (
				<div className="flex justify-center py-12">
					<Spinner />
				</div>
			) : (
				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as Tab)}
				>
					<TabsList className="mb-4">
						<TabsTrigger value="active">
							Active ({activePolls.length})
						</TabsTrigger>
						<TabsTrigger value="drafts">Drafts</TabsTrigger>
						<TabsTrigger value="ended">
							Ended ({endedPolls.length})
						</TabsTrigger>
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
