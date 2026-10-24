'use client';
import Link from 'next/link';

import { useLanguage } from '@/contexts/LanguageContext';
import type { TagDto } from '@/features/polls/schema';
import { topicHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

type HomepageHeaderProps = {
	tags: TagDto[];
	/** The selected topic's slug; none means every topic. */
	activeTag?: string;
	/** Signed-in viewers get a Following tab. */
	signedIn?: boolean;
	/** The Following tab is the selected one. */
	following?: boolean;
};

/** Topic tabs over the feed. Each is a link, so a topic can be shared and server-rendered. */
export function HomepageHeader({ tags, activeTag, signedIn, following }: HomepageHeaderProps) {
	const { t } = useLanguage();
	const items: { slug?: string; label: string; href: string; isActive?: boolean }[] = [
		{ label: t('homePage.allTopics'), href: '/', isActive: !following && !activeTag },
		...(signedIn ? [{ label: t('homePage.following'), href: '/following', isActive: following }] : []),
		...tags.map((tag) => ({
			slug: tag.slug,
			label: `#${tag.name}`,
			href: topicHref(tag.slug),
			isActive: tag.slug === activeTag,
		})),
	];

	// A filtered feed is that topic's page; the topic may not be among the popular ones listed
	const heading = following
		? t('homePage.following')
		: activeTag
			? (items.find((item) => item.slug === activeTag)?.label ?? `#${activeTag}`)
			: t('navigation.home');

	return (
		<>
			{/* The feed has no visible title; the page still needs one for headings navigation */}
			<h1 className="sr-only">{heading}</h1>
			<nav
				aria-label={t('homePage.topics')}
				className="sticky follow-header z-10 -mx-1 border-b border-border bg-background"
			>
				<ul className="flex gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
					{items.map(({ label, href, isActive }) => {
						return (
							<li key={href} className="shrink-0">
								<Link
									href={href}
									scroll={false}
									aria-current={isActive ? 'page' : undefined}
									className={cn(
										'relative flex min-h-11 items-center rounded-md px-3 text-[14px] font-medium transition-colors',
										isActive
											? 'text-foreground'
											: 'text-muted-foreground hover:text-foreground'
									)}
								>
									{label}
									{isActive && (
										<span
											aria-hidden
											className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground"
										/>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</>
	);
}
