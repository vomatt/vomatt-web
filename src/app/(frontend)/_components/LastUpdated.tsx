'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { formatDay } from '@/features/polls/format';

/** "Last updated October 29, 2026": when a Sanity page was last published. */
export function LastUpdated({ updatedAt }: { updatedAt: string }) {
	const { t, currentLanguage } = useLanguage();

	return (
		<p className="mb-8 text-[14px] text-muted-foreground">
			{t('page.lastUpdated')} <time dateTime={updatedAt}>{formatDay(updatedAt, currentLanguage)}</time>
		</p>
	);
}
