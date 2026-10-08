import { Suspense } from 'react';

import { LoginPrompt } from '@/components/LoginPrompt';
import { getUserSession } from '@/data/auth';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { getFeed, getPopularTags } from '@/features/polls/service';

import { HomepageHeader } from './_components/HomepageHeader';
import { PollFeedList } from './_components/PollFeedList';

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
	const { tag: tagParam } = await searchParams;
	// Repeated ?tag= arrives as an array; the feed filters by one topic
	const tag = Array.isArray(tagParam) ? tagParam[0] : tagParam;

	return (
		<div className="px-contain flex justify-center gap-8 py-0">
			<Suspense
				fallback={
					<div className="w-full max-w-[560px] py-4">
						<PollListSkeleton />
					</div>
				}
			>
				<Feed tag={tag} />
			</Suspense>
		</div>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ tag }: { tag: string | undefined }) {
	const [user, firstPage, tags] = await Promise.all([
		getUserSession(),
		getFeed(null, 10, tag).catch(() => null),
		getPopularTags(),
	]);

	return (
		<>
			<PollFeedList
				// Another topic, or a new poll at the top, starts a fresh list
				key={`${tag ?? ''}:${firstPage?.items[0]?.id ?? ''}`}
				viewerId={user?.sub}
				initialPage={firstPage}
				tag={tag}
				header={<HomepageHeader tags={tags} activeTag={tag} />}
			/>
			{!user && <LoginPrompt className="sticky top-[calc(var(--header-height)+1rem)]" />}
		</>
	);
}
