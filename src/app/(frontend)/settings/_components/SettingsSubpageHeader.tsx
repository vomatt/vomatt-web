'use client';

import Link from 'next/link';

import { useReturnTo } from '@/components/BackLink';
import { HeaderBack } from '@/components/layout/HeaderStart';
import { StickyBar } from '@/components/StickyBar';
import { ChevronLeft } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

/** The title row of a page opened from Settings, with the way back to it, or to the community page it was opened from. */
export function SettingsSubpageHeader({
	title,
	back,
}: {
	title: React.ReactNode;
	back?: { href: string; to: 'profile' | 'members'; name: string };
}) {
	const { t } = useLanguage();
	const href = back?.href ?? '/settings';
	const returnTo = useReturnTo(href);

	const label = back
		? t(back.to === 'profile' ? 'communities.acting.backToProfile' : 'communities.acting.backToMembers', { name: back.name })
		: t('settings.backToSettings');

	return (
		<>
			<HeaderBack href={href} onClick={returnTo} label={label} />
			{/* On phones the way back is in the Header, so the title scrolls away with the page */}
			<StickyBar
				data-sticky-bar="back"
				className="flex items-center gap-2 max-md:static max-md:[&>[data-sticky-fade]]:hidden"
			>
				<Link
					href={href}
					onClick={returnTo}
					aria-label={label}
					className="-ml-3 hidden md:inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-surface-soft active:bg-surface-soft focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
				>
					<ChevronLeft aria-hidden className="size-5.5" />
				</Link>
				<h1 className="text-title-1 text-foreground">{title}</h1>
			</StickyBar>
		</>
	);
}
