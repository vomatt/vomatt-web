'use client';

import { useLanguage } from '@/contexts/LanguageContext';

import type { Audience } from '../schema';

/** Marks a Poll that isn't Public; Public is the default and says nothing. */
export function AudienceLabel({ audience }: { audience?: Audience }) {
	const { t } = useLanguage();
	if (!audience || audience === 'public') return null;
	return (
		<span className="shrink-0 whitespace-nowrap before:mr-1.5 before:content-['·']">
			{t(`poll.audience.${audience}`)}
		</span>
	);
}
