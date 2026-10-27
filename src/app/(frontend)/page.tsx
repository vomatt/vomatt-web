import { Suspense } from 'react';

import { PageShell } from '@/components/layout/PageShell';
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
	// Read from the cookie, so the rail paints with the shell instead of after the feed
	const user = await getUserSession();

	return (
		<PageShell className="pt-0" rail={<HomeRail signedIn={!!user} />}>
			<Suspense
				fallback={
					<div className="w-full max-w-feed py-4">
						<PollListSkeleton />
					</div>
				}
			>
				<Feed tag={tag} viewerId={user?.sub} />
			</Suspense>
		</PageShell>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ tag, viewerId }: { tag: string | undefined; viewerId: string | undefined }) {
	const [profile, firstPage, tags] = await Promise.all([
		getMyProfile(),
		getFeed(null, 10, tag).catch(() => null),
		getPopularTags(),
	]);

	return (
		<PollFeedList
			// Another topic, or a new poll at the top, starts a fresh list
			key={`${tag ?? ''}:${firstPage?.items[0]?.id ?? ''}`}
			viewerId={viewerId}
			anonymousByDefault={profile?.anonymousBallotByDefault}
			initialPage={firstPage}
			tag={tag}
			header={<HomepageHeader tags={tags} activeTag={tag} signedIn={!!viewerId} />}
		/>
	);
}
