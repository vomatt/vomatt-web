'use client';

import { useId } from 'react';

import { Lock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

/** The rules in the rail for guests, who have no Polls of their own to list there. */
export function HowCountsCard() {
	const { t } = useLanguage();
	const headingId = useId();

	return (
		<section
			aria-labelledby={headingId}
			className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-[18px] text-body-4"
		>
			<h2 id={headingId} className="flex items-center gap-1.5 font-medium text-foreground">
				<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
				{t('navigation.howCountsTitle')}
			</h2>
			<p className="text-muted-foreground">{t('navigation.howCountsBody')}</p>
		</section>
	);
}
