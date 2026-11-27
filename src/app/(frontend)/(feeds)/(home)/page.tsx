import type { Metadata, ResolvingMetadata } from 'next';
import { Suspense } from 'react';

import { JsonLd } from '@/components/JsonLd';
import { getMyProfile, getUserSession } from '@/data/auth';
import { DEFAULT_SITE_NAME } from '@/data/constants';
import { getFeed, getFollowedTags, getTagBySlug } from '@/features/polls/service';
import { getServerMessages } from '@/lib/getServerLocale';
import { interpolate } from '@/lib/interpolate';
import { pageOpenGraph } from '@/lib/pageOpenGraph';
import { topicHref } from '@/lib/routes';
import { getSiteSettings } from '@/lib/siteSettings';
import { websiteJsonLd } from '@/lib/structuredData';

import { FeedSkeleton } from '../../_components/FeedSkeleton';
import { PollFeedList } from '../../_components/PollFeedList';
import { TopicFollowButton } from '../../_components/TopicFollowButton';

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

// Coming back within 3 minutes shows this page from the browser's cache instead of rendering it and
// calling the API again. Actions that revalidate drop it; pulling down refetches (`Refreshable`)
export const unstable_dynamicStaleTime = 180;

// Repeated ?tag= arrives as an array; the feed filters by one topic
const firstTag = (tag: string | string[] | undefined) => (Array.isArray(tag) ? tag[0] : tag);

export async function generateMetadata({ searchParams }: Props, parent: ResolvingMetadata): Promise<Metadata> {
	const tag = firstTag((await searchParams).tag);
	const [topic, { messages }] = await Promise.all([tag ? getTagBySlug(tag) : undefined, getServerMessages()]);
	// A ?tag= that names no topic shows the home feed's shell, so it is the home page to crawlers
	const href = topic ? topicHref(topic.slug) : '/';
	return {
		...(topic && {
			title: topic.name,
			description: topic.description || interpolate(messages.meta.topicDescription, { topic: topic.name }),
		}),
		alternates: { canonical: href },
		openGraph: await pageOpenGraph(parent, { url: href }),
	};
}

export default async function Page({ searchParams }: Props) {
	const tag = firstTag((await searchParams).tag);
	const [user, settings, { messages }] = await Promise.all([getUserSession(), getSiteSettings(), getServerMessages()]);

	return (
		<>
			<JsonLd
				data={websiteJsonLd({
					name: settings?.siteTitle || DEFAULT_SITE_NAME,
					description: messages.meta.siteDescription,
				})}
			/>
			<Suspense fallback={<FeedSkeleton />}>
				<Feed tag={tag} viewerId={user?.sub} />
			</Suspense>
		</>
	);
}

/** Streams in behind the skeleton so the shell paints first. */
async function Feed({ tag, viewerId }: { tag: string | undefined; viewerId: string | undefined }) {
	const [profile, firstPage, [topic, followedTags] = []] = await Promise.all([
		getMyProfile(),
		getFeed(null, 10, tag).catch(() => null),
		// Only a topic's page offers Follow
		viewerId && tag ? Promise.all([getTagBySlug(tag), getFollowedTags()]) : undefined,
	]);

	return (
		<>
			{topic && followedTags?.ok && (
				<TopicFollowButton
					key={topic.id}
					tagId={topic.id}
					initiallyFollowing={followedTags.data.some((followed) => followed.id === topic.id)}
				/>
			)}
			<PollFeedList
				// Another topic starts a fresh list
				key={tag ?? ''}
				viewerId={viewerId}
				anonymousByDefault={profile?.anonymousBallotByDefault}
				initialPage={firstPage}
				tag={tag}
			/>
		</>
	);
}
