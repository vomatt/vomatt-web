import type { Metadata } from 'next';
import { Suspense } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { PageShell } from '@/components/layout/PageShell';
import { Refreshable } from '@/components/Refreshable';
import { getMyProfile, getUserSession } from '@/data/auth';
import { DEFAULT_SITE_NAME } from '@/data/constants';
import { getFeed, getFollowedTags, getPopularTags } from '@/features/polls/service';
import { getServerMessages } from '@/lib/getServerLocale';
import { topicHref } from '@/lib/routes';
import { getSiteSettings } from '@/lib/siteSettings';
import { websiteJsonLd } from '@/lib/structuredData';

import { FeedSkeleton } from '../_components/FeedSkeleton';
import { HomepageHeader } from '../_components/HomepageHeader';
import { HomeRail } from '../_components/HomeRail';
import { PollFeedList } from '../_components/PollFeedList';
import { getRailPolls } from '../_components/RailPolls';

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

// Coming back within 3 minutes shows this page from the browser's cache instead of rendering it and
// calling the API again. Actions that revalidate drop it; pulling down refetches (`Refreshable`)
export const unstable_dynamicStaleTime = 180;

// Repeated ?tag= arrives as an array; the feed filters by one topic
const firstTag = (tag: string | string[] | undefined) => (Array.isArray(tag) ? tag[0] : tag);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
	const tag = firstTag((await searchParams).tag);
	return { alternates: { canonical: tag ? topicHref(tag) : '/' } };
}

export default async function Page({ searchParams }: Props) {
	const tag = firstTag((await searchParams).tag);
	// The layout waits on the same profile check, so the rail still paints with the shell instead of after the feed
	const [user, settings, { messages }] = await Promise.all([getUserSession(), getSiteSettings(), getServerMessages()]);

	return (
		<>
			<JsonLd
				data={websiteJsonLd({
					name: settings?.siteTitle || DEFAULT_SITE_NAME,
					description: messages.meta.siteDescription,
				})}
			/>
			<Refreshable>
				<PageShell className="pt-0" rail={<HomeRail signedIn={!!user} />}>
					<Suspense
						fallback={<FeedSkeleton signedIn={!!user} />}
					>
						<Feed tag={tag} viewerId={user?.sub} />
					</Suspense>
				</PageShell>
			</Refreshable>
		</>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ tag, viewerId }: { tag: string | undefined; viewerId: string | undefined }) {
	const [profile, firstPage, tags, followedTags] = await Promise.all([
		getMyProfile(),
		getFeed(null, 10, tag).catch(() => null),
		getPopularTags(),
		// Only a topic's page offers Follow
		viewerId && tag ? getFollowedTags() : null,
	]);

	return (
		<PollFeedList
			// Another topic starts a fresh list
			key={tag ?? ''}
			viewerId={viewerId}
			anonymousByDefault={profile?.anonymousBallotByDefault}
			initialPage={firstPage}
			tag={tag}
			header={
				<HomepageHeader
					tags={tags}
					activeTag={tag}
					signedIn={!!viewerId}
					followedTagIds={followedTags?.ok ? followedTags.data.map((followed) => followed.id) : undefined}
					resultsUnread={viewerId ? getRailPolls().then((rail) => rail.resultsUnread) : undefined}
				/>
			}
		/>
	);
}
