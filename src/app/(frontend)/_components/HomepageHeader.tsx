'use client';
import Link from 'next/link';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import { LegalLinks } from '@/components/layout/LegalLinks';
import { LoginPrompt } from '@/components/LoginPrompt';
import { StickyBar } from '@/components/StickyBar';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Check, ChevronDown, Plus } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import {
	PollSideCard,
	type SideCardKind,
} from '@/features/polls/components/PollSideCard';
import type { Poll, TagDto } from '@/features/polls/schema';
import { followTag, unfollowTag } from '@/features/polls/service';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { topicHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

type HomepageHeaderProps = {
	tags: TagDto[];
	/** The selected topic's slug; none means every topic. */
	activeTag?: string;
	/** Signed-in viewers get a Following tab; guests get the login prompt above the topics. */
	signedIn?: boolean;
	/** The Following tab is the selected one. */
	following?: boolean;
	/** Ids of the topics the viewer follows; a topic's page offers Follow once it is known. */
	followedTagIds?: string[];
	/** The rail's side cards. Below xl, where the rail follows a feed that never ends, each non-empty one is a pill that opens its polls. */
	sidePolls?: SidePolls;
};

type SidePolls = Record<SideCardKind, Poll[]>;
const SIDE_KINDS: SideCardKind[] = ['resultsIn', 'closingSoon'];
type PillLink = { label: string; href: string; isActive?: boolean };

/**
 * Topic pills over the feed. Each is a link, so a topic can be shared and server-rendered.
 * Below xl, Results are in and Closing soon follow the feeds as pills that open their polls.
 */
export function HomepageHeader({
	tags,
	activeTag,
	signedIn,
	following,
	followedTagIds,
	sidePolls,
}: HomepageHeaderProps) {
	const { t } = useLanguage();
	const [chosenSide, setChosenSide] = useState<SideCardKind | null>(null);
	const sidePanelId = useId();
	const sideKinds = SIDE_KINDS.filter(
		(kind) => (sidePolls?.[kind].length ?? 0) > 0
	);
	// A list that empties on refresh takes its pill away, so its card closes with it
	const openSide =
		chosenSide && sideKinds.includes(chosenSide) ? chosenSide : null;
	const feeds: PillLink[] = [
		{
			label: t('homePage.allTopics'),
			href: '/',
			isActive: !following && !activeTag,
		},
		...(signedIn
			? [
					{
						label: t('homePage.following'),
						href: '/following',
						isActive: following,
					},
				]
			: []),
	];
	const topics: PillLink[] = tags.map((tag) => ({
		label: tag.name,
		href: topicHref(tag.slug),
		isActive: tag.slug === activeTag,
	}));
	const pillClass = 'rounded-full px-3.5 text-caption-1';
	const renderLink = ({ label, href, isActive }: PillLink) => (
		<li key={href} className="shrink-0">
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
			</Link>
		</li>
	);

	// A filtered feed is that topic's page; the topic may not be among the popular ones listed
	const activeTagDto = tags.find((tag) => tag.slug === activeTag);
	const heading = following
		? t('homePage.following')
		: activeTag
			? (activeTagDto?.name ?? activeTag)
			: t('navigation.home');

	return (
		<>
			{/* The feed has no visible title; the page still needs one for headings navigation */}
			<h1 className="sr-only">{heading}</h1>
			{!signedIn && (
				<>
					<LoginPrompt className="mt-2" />
					{/* Guests' one way to the legal pages short of starting to log in, at every width; the links' padding makes them 44px tall */}
					<LegalLinks className="mb-2 flex flex-wrap gap-x-5 px-1 text-caption-2 text-muted-foreground [&>a]:py-3.5" />
				</>
			)}
			<StickyBar className="-mx-1">
				<nav aria-label={t('homePage.topics')}>
					<ul className="flex gap-2 overflow-x-auto px-1 py-2 scrollbar-none">
						{feeds.map(renderLink)}
						{sideKinds.map((kind) => {
							const open = openSide === kind;
							return (
								<li key={kind} className="shrink-0 xl:hidden">
									<Button
										variant="outline"
										size="sm"
										aria-expanded={open}
										aria-controls={open ? sidePanelId : undefined}
										onClick={() => setChosenSide(open ? null : kind)}
										className={pillClass}
									>
										{t(`homePage.${kind}`)}
										{sidePolls?.[kind].some((poll) => poll.unread) && (
											<UnreadDot label={t('notifications.unread')} />
										)}
										<ChevronDown
											aria-hidden
											className={cn(
												'transition-transform',
												open && 'rotate-180'
											)}
										/>
									</Button>
								</li>
							);
						})}
						{topics.map(renderLink)}
					</ul>
				</nav>
				{/* Inside the sticky bar, so a pill tapped after scrolling opens its card where it can be seen */}
				{openSide && sidePolls && (
					<div id={sidePanelId} className="px-1 pb-2 xl:hidden">
						<PollSideCard kind={openSide} polls={sidePolls[openSide]} />
					</div>
				)}
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
			className="mt-1 mb-2"
		>
			{following ? <Check aria-hidden /> : <Plus aria-hidden />}
			{t(following ? 'homePage.followingTopic' : 'homePage.followTopic')}
		</Button>
	);
}
