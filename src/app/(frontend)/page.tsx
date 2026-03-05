import { getPollsData } from '@/app/api/get-polls/getPollsData';
import { LoginPrompt } from '@/components/LoginPrompt';
import { getUserSession } from '@/data/auth';

import { PollFeedList } from './_components/PollFeedList';

export default async function Page() {
	const [user, data] = await Promise.all([getUserSession(), getPollsData()]);

	return (
		<div className="px-contain flex justify-center gap-10">
			<PollFeedList data={data} />
			{!user && <LoginPrompt className="sticky top-14" />}
		</div>
	);
}
