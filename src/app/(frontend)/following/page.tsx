import { Suspense } from 'react';

import { PageShell } from '@/components/layout/PageShell';
import { getMyProfile, getUserSession, redirectToLogin } from '@/data/auth';
import { getFollowingFeed, getPopularTags } from '@/features/polls/service';

import { FeedSkeleton } from '../_components/FeedSkeleton';
import { HomepageHeader } from '../_components/HomepageHeader';
import { HomeRail } from '../_components/HomeRail';
import { PollFeedList } from '../_components/PollFeedList';
import { getRailPolls, RailPollsStrip } from '../_components/RailPolls';

export default async function FollowingPage() {
	// The proxy sends signed-out users to login with a 307; this backs it up
	const user = await getUserSession();
	if (!user) return redirectToLogin('/following');

	return (
		<PageShell className="pt-0" rail={<HomeRail signedIn />}>
			<Suspense
				fallback={<FeedSkeleton />}
			>
				<Feed viewerId={user.sub} />
			</Suspense>
		</PageShell>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ viewerId }: { viewerId: string }) {
	// Starts the strip's fetch alongside the feed's
	void getRailPolls();
	const [profile, firstPage, tags] = await Promise.all([
		getMyProfile(),
		getFollowingFeed().catch(() => null),
		getPopularTags(),
	]);

	return (
		<PollFeedList
			// A new poll at the top starts a fresh list
			key={firstPage?.items[0]?.id ?? ''}
			viewerId={viewerId}
			anonymousByDefault={profile?.anonymousBallotByDefault}
			initialPage={firstPage}
			following
			header={
				<>
					<HomepageHeader tags={tags} signedIn following />
					<RailPollsStrip />
				</>
			}
		/>
	);
}
