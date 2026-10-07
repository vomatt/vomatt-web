import { LoginPrompt } from '@/components/LoginPrompt';
import { getUserSession } from '@/data/auth';
import { getFeed, getPopularTags } from '@/features/polls/service';

import { HomepageHeader } from './_components/HomepageHeader';
import { PollFeedList } from './_components/PollFeedList';

type Props = { searchParams: Promise<{ tag?: string }> };

export default async function Page({ searchParams }: Props) {
	const { tag } = await searchParams;
	const [user, firstPage, tags] = await Promise.all([
		getUserSession(),
		getFeed(null, 10, tag).catch(() => null),
		getPopularTags(),
	]);

	return (
		<div className="px-contain flex justify-center gap-8 py-0">
			<PollFeedList
				// A new topic, or a new poll at the top after publishing, starts a fresh list
				key={`${tag ?? ''}:${firstPage?.items[0]?.id ?? ''}`}
				viewerId={user?.sub}
				initialPage={firstPage}
				tag={tag}
				header={<HomepageHeader tags={tags} activeTag={tag} />}
			/>
			{!user && <LoginPrompt className="sticky top-[calc(var(--header-height)+1rem)]" />}
		</div>
	);
}
