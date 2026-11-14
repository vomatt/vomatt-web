'use client';
import Link from 'next/link';
import { Suspense, use, useState } from 'react';
import { toast } from 'sonner';

import { LegalLinks } from '@/components/layout/LegalLinks';
import { LoginPrompt } from '@/components/LoginPrompt';
import { StickyBar } from '@/components/StickyBar';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Check, Plus } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import {
	FEED_KINDS,
	type FeedKind,
	FEEDS,
	isRailFeed,
} from '@/features/polls/feeds';
import type { TagDto } from '@/features/polls/schema';
import { followTag, unfollowTag } from '@/features/polls/service';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { topicHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

type HomepageHeaderProps = {
	tags: TagDto[];
	/** The selected topic's slug; none means every topic. */
	activeTag?: string;
	/** Signed-in viewers get the Following, Results are in and Closing soon feeds; guests get the login prompt above the topics. */
	signedIn?: boolean;
	/** The feed shown; For you unless another feed's page. */
	feed?: FeedKind;
	/** Ids of the topics the viewer follows; a topic's page offers Follow once it is known. */
	followedTagIds?: string[];
	/** Whether a result is unread, for the Results are in pill's dot; streamed so the feed doesn't wait on it. */
	resultsUnread?: Promise<boolean>;
};

type PillLink = {
	label: string;
	href: string;
	isActive?: boolean;
	className?: string;
	dot?: Promise<boolean>;
};

/** Feed and topic pills over the feed. Each is a link, so a feed or topic can be shared and server-rendered. */
export function HomepageHeader({
	tags,
	activeTag,
	signedIn,
	feed = 'forYou',
	followedTagIds,
	resultsUnread,
}: HomepageHeaderProps) {
	const { t } = useLanguage();
	const feeds: PillLink[] = FEED_KINDS.filter(
		(kind) => signedIn || kind === 'forYou'
	).map((kind) => {
		const isActive = kind === feed && !activeTag;
		return {
			label: t(FEEDS[kind].label),
			href: FEEDS[kind].href,
			isActive,
			// From xl the rail's card titles link to these feeds, so their pills show there only while current
			className: isRailFeed(kind) && !isActive ? 'xl:hidden' : undefined,
			dot: kind === 'resultsIn' ? resultsUnread : undefined,
		};
	});
	const topics: PillLink[] = tags.map((tag) => ({
		label: tag.name,
		href: topicHref(tag.slug),
		isActive: tag.slug === activeTag,
	}));
	const pillClass = 'rounded-full px-3.5 text-caption-1';
	const renderLink = ({ label, href, isActive, className, dot }: PillLink) => (
		<li key={href} className={cn('shrink-0', className)}>
			<Link
				href={href}
				scroll={false}
				aria-current={isActive ? 'page' : undefined}
				className={buttonVariants({
					variant: isActive ? 'default' : 'outline',
					size: 'sm',
					className: pillClass,
				})}
			>
				{label}
				{dot && (
					<Suspense>
						<StreamedUnreadDot unread={dot} />
					</Suspense>
				)}
			</Link>
		</li>
	);

	// A filtered feed is that topic's page; the topic may not be among the popular ones listed
	const activeTagDto = tags.find((tag) => tag.slug === activeTag);
	const heading = activeTag
		? (activeTagDto?.name ?? activeTag)
		: feed === 'forYou'
			? t('navigation.home')
			: t(FEEDS[feed].label);

	return (
		<>
			{/* The feed has no visible title; the page still needs one for headings navigation */}
			<h1 className="sr-only">{heading}</h1>
			{!signedIn && (
				<>
					<LoginPrompt className="mt-6" />
					{/* Guests' one way to the legal pages short of starting to log in, at every width; the links' padding makes them 44px tall */}
					<LegalLinks className="flex flex-wrap gap-x-5 px-1 text-caption-2 text-muted-foreground [&>a]:py-3.5" />
				</>
			)}
			{/* Its pills sit at its bottom, with the room above them inside it, so it sticks where it rests and never moves */}
			<StickyBar data-sticky-bar="feed" className="-mx-1 max-md:mx-0">
				<nav aria-label={t('homePage.topics')}>
					<ul className="flex gap-2 overflow-x-auto h-(--feed-bar-height) items-end px-1 py-2 scrollbar-none max-md:bleed-x">
						{feeds.map(renderLink)}
						{topics.map(renderLink)}
					</ul>
				</nav>
			</StickyBar>
			{signedIn && activeTagDto && followedTagIds && (
				<TopicFollowButton
					key={activeTagDto.id}
					tagId={activeTagDto.id}
					initiallyFollowing={followedTagIds.includes(activeTagDto.id)}
				/>
			)}
		</>
	);
}

function StreamedUnreadDot({ unread }: { unread: Promise<boolean> }) {
	const { t } = useLanguage();
	return use(unread) ? <UnreadDot label={t('notifications.unread')} /> : null;
}

/** Following a topic adds its Open Public Polls to the Following feed. One tap undoes it. */
function TopicFollowButton({
	tagId,
	initiallyFollowing,
}: {
	tagId: string;
	initiallyFollowing: boolean;
}) {
	const { t } = useLanguage();
	const [following, setFollowing] = useState(initiallyFollowing);
	const [isPending, setIsPending] = useState(false);

	const toggle = async () => {
		const next = !following;
		setFollowing(next);
		setIsPending(true);
		const result = await settle(next ? followTag(tagId) : unfollowTag(tagId));
		setIsPending(false);
		if (!result.ok) {
			setFollowing(!next);
			toast.error(
				apiErrorText(
					t,
					result,
					next ? 'homePage.followTopicFailed' : 'homePage.unfollowTopicFailed'
				)
			);
		}
	};

	return (
		<Button
			size="sm"
			variant={following ? 'outline' : 'default'}
			aria-pressed={following}
			onClick={toggle}
			disabled={isPending}
			// Starts where the first card would, level with the rail's first card
			className="mt-2 mb-2"
		>
			{following ? <Check aria-hidden /> : <Plus aria-hidden />}
			{t(following ? 'homePage.followingTopic' : 'homePage.followTopic')}
		</Button>
	);
}
