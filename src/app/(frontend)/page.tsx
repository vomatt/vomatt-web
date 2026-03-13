import { getPolls } from '@/lib/api/endpoints/polls';
import { LoginPrompt } from '@/components/LoginPrompt';
import { getUserSession } from '@/data/auth';

import { PollFeedList } from './_components/PollFeedList';

export default async function Page() {
	const [user, data] = await Promise.all([getUserSession(), getPolls()]);

	return (
		<div className="px-contain flex justify-center gap-10">
			<PollFeedList data={data} />
			{!user && <LoginPrompt className="sticky top-14" />}
		</div>
	);
}
