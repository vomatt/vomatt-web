import { Suspense } from 'react';

import { PageShell } from '@/components/layout/PageShell';
import { getMyProfile, getUserSession, redirectToLogin } from '@/data/auth';
import { type FeedKind, FEEDS } from '@/features/polls/feeds';
import { getPopularTags } from '@/features/polls/service';

import { FeedSkeleton } from './FeedSkeleton';
import { HomepageHeader } from './HomepageHeader';
import { HomeRail } from './HomeRail';
import { PollFeedList } from './PollFeedList';
import { getFirstPage, getRailPolls } from './RailPolls';

type SignedInFeed = Exclude<FeedKind, 'forYou'>;

/** A home feed only signed-in viewers have, under the same pills and rail as For you. */
export async function SignedInFeedPage({ feed }: { feed: SignedInFeed }) {
	// The proxy sends signed-out users to login with a 307; this backs it up
	const user = await getUserSession();
	if (!user) return redirectToLogin(FEEDS[feed].href);

	return (
		<PageShell className="pt-0" rail={<HomeRail signedIn />}>
			<Suspense fallback={<FeedSkeleton />}>
				<Feed feed={feed} viewerId={user.sub} />
			</Suspense>
		</PageShell>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ feed, viewerId }: { feed: SignedInFeed; viewerId: string }) {
	const [profile, firstPage, tags] = await Promise.all([
		getMyProfile(),
		getFirstPage(feed).catch(() => null),
		getPopularTags(),
	]);

	return (
		<PollFeedList
			// A new poll at the top starts a fresh list
			key={firstPage?.items[0]?.id ?? ''}
			viewerId={viewerId}
			anonymousByDefault={profile?.anonymousBallotByDefault}
			initialPage={firstPage}
			feed={feed}
			header={
				<HomepageHeader
					tags={tags}
					signedIn
					feed={feed}
					resultsUnread={getRailPolls().then((rail) => rail.resultsUnread)}
				/>
			}
		/>
	);
}
