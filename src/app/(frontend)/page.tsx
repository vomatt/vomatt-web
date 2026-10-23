import { Suspense } from 'react';

import { LoginPrompt } from '@/components/LoginPrompt';
import { getMyProfile, getUserSession } from '@/data/auth';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { getFeed, getPopularTags } from '@/features/polls/service';

import { HomepageHeader } from './_components/HomepageHeader';
import { HomeRail } from './_components/HomeRail';
import { PollFeedList } from './_components/PollFeedList';

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
	const { tag: tagParam } = await searchParams;
	// Repeated ?tag= arrives as an array; the feed filters by one topic
	const tag = Array.isArray(tagParam) ? tagParam[0] : tagParam;

	return (
		// The rail sits beside the feed from xl up, where both fit next to the sidebar; below that it follows the feed
		<div className="px-contain flex flex-col items-center gap-8 py-0 xl:flex-row xl:items-start xl:justify-center">
			<Suspense
				fallback={
					<div className="w-full max-w-feed py-4">
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
	const [user, profile, firstPage, tags] = await Promise.all([
		getUserSession(),
		getMyProfile(),
		getFeed(null, 10, tag).catch(() => null),
		getPopularTags(),
	]);

	return (
		<>
			<PollFeedList
				// Another topic, or a new poll at the top, starts a fresh list
				key={`${tag ?? ''}:${firstPage?.items[0]?.id ?? ''}`}
				viewerId={user?.sub}
				anonymousByDefault={profile?.anonymousBallotByDefault}
				initialPage={firstPage}
				tag={tag}
				header={<HomepageHeader tags={tags} activeTag={tag} />}
			/>
			<aside className="flex w-full max-w-feed flex-col gap-4 pb-8 xl:sticky xl:top-[calc(var(--header-height)+1rem)] xl:w-[280px] xl:shrink-0 xl:py-4">
				{!user && <LoginPrompt />}
				<Suspense fallback={null}>
					<HomeRail signedIn={!!user} />
				</Suspense>
			</aside>
		</>
	);
}
