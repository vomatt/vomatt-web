import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { getUserSession } from '@/data/auth';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { getMyPolls } from '@/features/polls/service';

import MyPollsTabs from './_components/MyPollsTabs';

export default async function MyPollsPage() {
	// Check auth before streaming the shell, so signed-out users get a real 307
	const user = await getUserSession();
	if (!user) redirect('/login');

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="text-4xl text-foreground mb-6">My Polls</h1>
			<Suspense
				fallback={
					<>
						<Skeleton className="mb-4 h-9 w-56 rounded-lg" />
						<PollListSkeleton />
					</>
				}
			>
				<MyPolls />
			</Suspense>
		</div>
	);
}

async function MyPolls() {
	// API unavailable — render empty lists instead of crashing
	const empty = { items: [], nextCursor: null };
	const [open, ended] = await Promise.all([
		getMyPolls('open').catch(() => empty),
		getMyPolls('ended').catch(() => empty),
	]);

	return <MyPollsTabs open={open} ended={ended} />;
}
