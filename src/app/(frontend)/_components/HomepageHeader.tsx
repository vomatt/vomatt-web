'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, use } from 'react';

import { LoginPrompt } from '@/components/LoginPrompt';
import { StickyBar } from '@/components/StickyBar';
import { buttonVariants } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import {
	FEED_KINDS,
	FEEDS,
	isRailFeed,
} from '@/features/polls/feeds';
import type { TagDto } from '@/features/polls/schema';
import { topicHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

type HomepageHeaderProps = {
	/** Only what a pill shows: the layout sends these to the client on every feed page. */
	tags: Pick<TagDto, 'name' | 'slug'>[];
	/** Signed-in viewers get the Following, Results are in and Closing soon feeds; guests get the login prompt above the topics. */
	signedIn?: boolean;
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

/**
 * Feed and topic pills over the feed. Each is a link, so a feed or topic can be shared and server-rendered.
 * It sits in the feeds' layout and stays mounted across them, so it reads the current feed and topic from the URL.
 */
export function HomepageHeader({ tags, signedIn, resultsUnread }: HomepageHeaderProps) {
	const { t } = useLanguage();
	const pathname = usePathname();
	const feed = FEED_KINDS.find((kind) => FEEDS[kind].href === pathname) ?? 'forYou';
	const searchParams = useSearchParams();
	// Only For you filters by topic; repeated ?tag= takes the first, like the page
	const activeTag = (feed === 'forYou' && searchParams.get('tag')) || undefined;
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
	const heading = activeTag
		? (tags.find((tag) => tag.slug === activeTag)?.name ?? activeTag)
		: feed === 'forYou'
			? t('navigation.home')
			: t(FEEDS[feed].label);

	return (
		<>
			{/* The feed has no visible title; the page still needs one for headings navigation */}
			<h1 className="sr-only">{heading}</h1>
			{!signedIn && <LoginPrompt className="mt-6" />}
			{/* Its pills sit at its bottom, with the room above them inside it, so it sticks where it rests and never moves.
			    Phones scroll it away: the fixed Header and TabBar already take their room */}
			<StickyBar data-sticky-bar="feed" className="-mx-1 max-md:static max-md:mx-0">
				<nav aria-label={t('homePage.topics')}>
					<ul className="flex gap-2 overflow-x-auto h-(--feed-bar-height) items-end px-1 py-2 scrollbar-none max-md:bleed-x">
						{feeds.map(renderLink)}
						{topics.map(renderLink)}
					</ul>
				</nav>
			</StickyBar>
		</>
	);
}

function StreamedUnreadDot({ unread }: { unread: Promise<boolean> }) {
	const { t } = useLanguage();
	return use(unread) ? <UnreadDot label={t('notifications.unread')} /> : null;
}
