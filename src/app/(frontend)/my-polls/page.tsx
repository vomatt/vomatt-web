import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getUserSession } from '@/data/auth';
import { getMyPolls } from '@/features/polls/service';
import { EMPTY_PAGE } from '@/lib/api/cursor';

import MyPollsTabs, { MyPollsTabsSkeleton } from './_components/MyPollsTabs';

export default async function MyPollsPage() {
	// Check auth before streaming the shell, so signed-out users get a real 307
	const user = await getUserSession();
	if (!user) redirect('/login');

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="mb-6 display-heading text-[32px] text-foreground md:text-[44px]">My Polls</h1>
			<Suspense fallback={<MyPollsTabsSkeleton />}>
				<MyPolls />
			</Suspense>
		</div>
	);
}

async function MyPolls() {
	// API unavailable — render empty lists instead of crashing
	const [open, ended] = await Promise.all([
		getMyPolls('open').catch(() => EMPTY_PAGE),
		getMyPolls('ended').catch(() => EMPTY_PAGE),
	]);

	return <MyPollsTabs open={open} ended={ended} />;
}
