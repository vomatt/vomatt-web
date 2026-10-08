import { LoginPrompt } from '@/components/LoginPrompt';
import { getUserSession } from '@/data/auth';
import { getFeed, getPopularTags } from '@/features/polls/service';

import { HomepageHeader } from './_components/HomepageHeader';
import { PollFeedList } from './_components/PollFeedList';

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
	const { tag: tagParam } = await searchParams;
	// Repeated ?tag= arrives as an array; the feed filters by one topic
	const tag = Array.isArray(tagParam) ? tagParam[0] : tagParam;
	const [user, firstPage, tags] = await Promise.all([
		getUserSession(),
		getFeed(null, 10, tag).catch(() => null),
		getPopularTags(),
	]);

	return (
		<div className="px-contain flex justify-center gap-8 py-0">
			<PollFeedList
				// Another topic starts a fresh list
				key={tag ?? ''}
				viewerId={user?.sub}
				initialPage={firstPage}
				tag={tag}
				header={<HomepageHeader tags={tags} activeTag={tag} />}
			/>
			{!user && <LoginPrompt className="sticky top-[calc(var(--header-height)+1rem)]" />}
		</div>
	);
}
