import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getMyProfile, getUserSession } from '@/data/auth';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { getFollowingFeed, getPopularTags } from '@/features/polls/service';

import { HomepageHeader } from '../_components/HomepageHeader';
import { HomeRail } from '../_components/HomeRail';
import { PollFeedList } from '../_components/PollFeedList';

export default async function FollowingPage() {
	// Check auth before streaming the shell, so signed-out users get a real 307
	const user = await getUserSession();
	if (!user) redirect('/login');

	return (
		<div className="px-contain flex flex-col items-center gap-8 pb-16 xl:flex-row xl:items-start xl:justify-center">
			<Suspense
				fallback={
					<div className="w-full max-w-feed py-4">
						<PollListSkeleton />
					</div>
				}
			>
				<Feed viewerId={user.sub} />
			</Suspense>
		</div>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ viewerId }: { viewerId: string }) {
	const [profile, firstPage, tags] = await Promise.all([
		getMyProfile(),
		getFollowingFeed().catch(() => null),
		getPopularTags(),
	]);

	return (
		<>
			<PollFeedList
				// A new poll at the top starts a fresh list
				key={firstPage?.items[0]?.id ?? ''}
				viewerId={viewerId}
				anonymousByDefault={profile?.anonymousBallotByDefault}
				initialPage={firstPage}
				following
				header={<HomepageHeader tags={tags} signedIn following />}
			/>
			<HomeRail signedIn />
		</>
	);
}
