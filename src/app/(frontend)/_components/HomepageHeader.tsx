'use client';
import Link from 'next/link';

import { useLanguage } from '@/contexts/LanguageContext';
import type { TagDto } from '@/features/polls/schema';
import { cn } from '@/lib/utils';

type HomepageHeaderProps = {
	tags: TagDto[];
	/** The selected topic's slug; none means every topic. */
	activeTag?: string;
};

/** Topic tabs over the feed. Each is a link, so a topic can be shared and server-rendered. */
export function HomepageHeader({ tags, activeTag }: HomepageHeaderProps) {
	const { t } = useLanguage();
	const items: { slug?: string; label: string }[] = [
		{ label: t('homePage.allTopics') },
		...tags.map((tag) => ({ slug: tag.slug, label: `#${tag.name}` })),
	];

	return (
		<nav
			aria-label={t('homePage.topics')}
			className="sticky top-0 z-10 -mx-1 border-b border-border bg-background/95 backdrop-blur-sm"
		>
			<ul className="flex gap-1 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
				{items.map(({ slug, label }) => {
					const isActive = slug === activeTag;
					return (
						<li key={slug ?? 'all'} className="shrink-0">
							<Link
								href={slug ? `/?tag=${encodeURIComponent(slug)}` : '/'}
								scroll={false}
								aria-current={isActive ? 'page' : undefined}
								className={cn(
									'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
									isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
								)}
							>
								{label}
								{isActive && <span className="mt-0.5 block h-0.5 rounded-full bg-foreground" />}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
