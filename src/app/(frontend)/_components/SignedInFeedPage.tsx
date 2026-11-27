import { Suspense } from 'react';

import { getMyProfile, getUserSession, redirectToLogin } from '@/data/auth';
import { type FeedKind, FEEDS } from '@/features/polls/feeds';

import { FeedSkeleton } from './FeedSkeleton';
import { PollFeedList } from './PollFeedList';
import { getFirstPage } from './RailPolls';

type SignedInFeed = Exclude<FeedKind, 'forYou'>;

/** A home feed only signed-in viewers have; the feeds' layout puts it under the same pills and rail as For you. */
export async function SignedInFeedPage({ feed }: { feed: SignedInFeed }) {
	// The proxy sends signed-out users to login with a 307; this backs it up
	const user = await getUserSession();
	if (!user) return redirectToLogin(FEEDS[feed].href);

	return (
		<Suspense fallback={<FeedSkeleton />}>
			<Feed feed={feed} viewerId={user.sub} />
		</Suspense>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ feed, viewerId }: { feed: SignedInFeed; viewerId: string }) {
	const [profile, firstPage] = await Promise.all([getMyProfile(), getFirstPage(feed).catch(() => null)]);

	return (
		<PollFeedList
			viewerId={viewerId}
			anonymousByDefault={profile?.anonymousBallotByDefault}
			initialPage={firstPage}
			feed={feed}
		/>
	);
}
