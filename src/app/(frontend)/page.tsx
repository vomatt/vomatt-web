import { LoginPrompt } from '@/components/LoginPrompt';
import { getUserSession } from '@/data/auth';

import { PollFeedList } from './_components/PollFeedList';

export default async function Page() {
	const user = await getUserSession();

	return (
		<div className="px-contain flex justify-center gap-8 py-0">
			<PollFeedList />
			{!user && <LoginPrompt className="sticky top-[calc(var(--header-height)+1rem)]" />}
		</div>
	);
}
