'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

import CustomPortableText from '@/components/CustomPortableText';
import { Button } from '@/components/ui/Button';
import { X } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { htmlLang } from '@/i18n-config';
import { isChromeless } from '@/lib/routes';

import { type Announcement, ANNOUNCEMENT_DISMISSED_COOKIE } from './schema';

/** The admins' announcement over every page, until the visitor dismisses it. */
export function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
	const { t, currentLanguage } = useLanguage();
	const pathname = usePathname();
	const [dismissedId, setDismissedId] = useState<string | null>(null);
	if (!announcement || announcement.id === dismissedId || isChromeless(pathname)) return null;

	const inChinese = currentLanguage === 'zh' && announcement.messageZh !== null;
	const dismiss = () => {
		document.cookie = `${ANNOUNCEMENT_DISMISSED_COOKIE}=${announcement.id}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
		setDismissedId(announcement.id);
	};

	return (
		<section aria-label={t('announcement.label')} className="flex items-center gap-3 border-b border-border bg-primary/6 px-4 py-2.5 text-caption-1 text-foreground md:px-6">
			{/* The English fallback on a Chinese page, marked so screen readers read it as English */}
			<div lang={currentLanguage === 'zh' && !inChinese ? htmlLang('en') : undefined} className="min-w-0 flex-1 space-y-1">
				<CustomPortableText blocks={inChinese ? announcement.messageZh : announcement.message} />
			</div>
			{/* Negative margin lets the 44px target overlap the band's padding instead of making the band taller */}
			<Button variant="ghost" size="icon-xs" aria-label={t('announcement.dismiss')} onClick={dismiss} className="-my-2.5">
				<X aria-hidden />
			</Button>
		</section>
	);
}
