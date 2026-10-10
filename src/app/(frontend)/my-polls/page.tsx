import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { getUserSession } from '@/data/auth';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { Poll } from '@/features/polls/schema';
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
	let polls: Poll[] = [];
	try {
		polls = await getMyPolls();
	} catch {
		// API unavailable — render empty state instead of crashing
	}

	return <MyPollsTabs polls={polls} />;
}
