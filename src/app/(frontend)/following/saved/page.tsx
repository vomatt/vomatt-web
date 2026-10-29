import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { PageShell } from '@/components/layout/PageShell';
import { getMyProfile, getUserSession } from '@/data/auth';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { getBookmarkedPolls, getPopularTags } from '@/features/polls/service';

import { HomepageHeader } from '../../_components/HomepageHeader';
import { HomeRail } from '../../_components/HomeRail';
import { PollFeedList } from '../../_components/PollFeedList';

// Under /following, a reserved root segment, so no username can shadow it
export default async function SavedPage() {
	// Check auth before streaming the shell, so signed-out users get a real 307
	const user = await getUserSession();
	if (!user) redirect('/login?redirect=/following/saved');

	return (
		<PageShell className="pt-0" rail={<HomeRail signedIn />}>
			<Suspense
				fallback={
					<div className="w-full max-w-feed py-4">
						<PollListSkeleton />
					</div>
				}
			>
				<Feed viewerId={user.sub} />
			</Suspense>
		</PageShell>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ viewerId }: { viewerId: string }) {
	const [profile, firstPage, tags] = await Promise.all([
		getMyProfile(),
		getBookmarkedPolls().catch(() => null),
		getPopularTags(),
	]);

	return (
		<PollFeedList
			// A newly saved poll at the top starts a fresh list
			key={firstPage?.items[0]?.id ?? ''}
			viewerId={viewerId}
			anonymousByDefault={profile?.anonymousBallotByDefault}
			initialPage={firstPage}
			bookmarked
			header={<HomepageHeader tags={tags} signedIn saved />}
		/>
	);
}
