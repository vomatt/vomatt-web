import { getMyPolls } from '@/lib/api/endpoints/polls';

import MyPollsTabs from './_components/MyPollsTabs';

export default async function MyPollsPage() {
	const data = await getMyPolls();
	const polls = data?.content ?? [];

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<h1 className="text-4xl text-foreground mb-6">My Polls</h1>
			<MyPollsTabs polls={polls} />
		</div>
	);
}
