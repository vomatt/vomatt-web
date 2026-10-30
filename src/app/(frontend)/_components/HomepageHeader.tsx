'use client';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { LoginPrompt } from '@/components/LoginPrompt';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Check, Plus } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TagDto } from '@/features/polls/schema';
import { followTag, unfollowTag } from '@/features/polls/service';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { topicHref } from '@/lib/routes';

type HomepageHeaderProps = {
	tags: TagDto[];
	/** The selected topic's slug; none means every topic. */
	activeTag?: string;
	/** Signed-in viewers get a Following tab; guests get the login prompt above the topics. */
	signedIn?: boolean;
	/** The Following tab is the selected one. */
	following?: boolean;
	/** The Saved tab is the selected one. */
	saved?: boolean;
	/** Ids of the topics the viewer follows; a topic's page offers Follow once it is known. */
	followedTagIds?: string[];
};

/** Topic pills over the feed. Each is a link, so a topic can be shared and server-rendered. */
export function HomepageHeader({
	tags,
	activeTag,
	signedIn,
	following,
	saved,
	followedTagIds,
}: HomepageHeaderProps) {
	const { t } = useLanguage();
	const items: {
		slug?: string;
		label: string;
		href: string;
		isActive?: boolean;
	}[] = [
		{
			label: t('homePage.allTopics'),
			href: '/',
			isActive: !following && !saved && !activeTag,
		},
		...(signedIn
			? [
					{
						label: t('homePage.following'),
						href: '/following',
						isActive: following,
					},
					{
						label: t('homePage.bookmarks'),
						href: '/following/saved',
						isActive: saved,
					},
				]
			: []),
		...tags.map((tag) => ({
			slug: tag.slug,
			label: tag.name,
			href: topicHref(tag.slug),
			isActive: tag.slug === activeTag,
		})),
	];

	// A filtered feed is that topic's page; the topic may not be among the popular ones listed
	const activeTagDto = tags.find((tag) => tag.slug === activeTag);
	const heading = saved
		? t('homePage.bookmarks')
		: following
			? t('homePage.following')
			: activeTag
				? (activeTagDto?.name ?? activeTag)
				: t('navigation.home');

	return (
		<>
			{/* The feed has no visible title; the page still needs one for headings navigation */}
			<h1 className="sr-only">{heading}</h1>
			{!signedIn && <LoginPrompt className="my-2" />}
			<nav
				aria-label={t('homePage.topics')}
				className="sticky follow-header z-20 -mx-1 bg-background/60 backdrop-blur-sm"
			>
				<ul className="flex gap-2 overflow-x-auto px-1 py-2 scrollbar-none">
					{items.map(({ label, href, isActive }) => (
						<li key={href} className="shrink-0">
							<Link
								href={href}
								scroll={false}
								aria-current={isActive ? 'page' : undefined}
								className={buttonVariants({
									variant: isActive ? 'default' : 'outline',
									size: 'sm',
									className: 'rounded-full px-3.5 text-[13px]',
								})}
							>
								{label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
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
