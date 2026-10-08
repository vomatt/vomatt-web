import { redirect } from 'next/navigation';

import { getUserSession } from '@/data/auth';
import { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';

import MyPollsTabs from './_components/MyPollsTabs';

export default async function MyPollsPage() {
	const user = await getUserSession();
	if (!user) redirect('/login');

	let polls: Poll[] = [];
	try {
		polls = await getMyPolls();
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
