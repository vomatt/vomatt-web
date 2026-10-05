import { redirect } from 'next/navigation';

import { getUserSession } from '@/data/auth';
import { getMyPolls } from '@/features/polls/service';
import { Poll } from '@/features/polls/schema';

import MyPollsTabs from './_components/MyPollsTabs';

export default async function MyPollsPage() {
	const user = await getUserSession();
	if (!user) redirect('/login');

	let polls: Poll[] = [];
	try {
		const data = await getMyPolls();
		polls = data?.content ?? [];
	} catch {
		// API unavailable — render empty state instead of crashing
	}

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="text-4xl text-foreground mb-6">My Polls</h1>
			<MyPollsTabs polls={polls} />
		</div>
	);
}
