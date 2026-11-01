'use client';

import Link from 'next/link';

import { StickyBar } from '@/components/StickyBar';
import { ChevronLeft } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

/** The title row of a page opened from Settings, with the way back to it. */
export function SettingsSubpageHeader({ title }: { title: React.ReactNode }) {
	const { t } = useLanguage();
	return (
		<StickyBar data-sticky-bar className="flex items-center gap-2">
			<Link
				href="/settings"
				aria-label={t('settings.backToSettings')}
				className="-ml-3 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors outline-none hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
			>
				<ChevronLeft aria-hidden className="size-5.5" />
			</Link>
			<h1 className="text-title-1 text-foreground">{title}</h1>
		</StickyBar>
	);
}
