'use client';
import Link from 'next/link';

import { LoginPrompt } from '@/components/LoginPrompt';
import { buttonVariants } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TagDto } from '@/features/polls/schema';
import { topicHref } from '@/lib/routes';

type HomepageHeaderProps = {
	tags: TagDto[];
	/** The selected topic's slug; none means every topic. */
	activeTag?: string;
	/** Signed-in viewers get a Following tab; guests get the login prompt above the topics. */
	signedIn?: boolean;
	/** The Following tab is the selected one. */
	following?: boolean;
};

/** Topic pills over the feed. Each is a link, so a topic can be shared and server-rendered. */
export function HomepageHeader({ tags, activeTag, signedIn, following }: HomepageHeaderProps) {
	const { t } = useLanguage();
	const items: { slug?: string; label: string; href: string; isActive?: boolean }[] = [
		{ label: t('homePage.allTopics'), href: '/', isActive: !following && !activeTag },
		...(signedIn ? [{ label: t('homePage.following'), href: '/following', isActive: following }] : []),
		...tags.map((tag) => ({
			slug: tag.slug,
			label: tag.name,
			href: topicHref(tag.slug),
			isActive: tag.slug === activeTag,
		})),
	];

	// A filtered feed is that topic's page; the topic may not be among the popular ones listed
	const heading = following
		? t('homePage.following')
		: activeTag
			? (items.find((item) => item.slug === activeTag)?.label ?? activeTag)
			: t('navigation.home');

	return (
		<>
			{/* The feed has no visible title; the page still needs one for headings navigation */}
			<h1 className="sr-only">{heading}</h1>
			{!signedIn && <LoginPrompt className="my-2" />}
			<nav aria-label={t('homePage.topics')} className="sticky follow-header z-10 -mx-1 bg-background">
				<ul className="flex gap-2 overflow-x-auto px-1 py-2 [scrollbar-width:none]">
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
		</>
	);
}
