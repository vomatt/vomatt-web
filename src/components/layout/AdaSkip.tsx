'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function AdaSkip() {
	const { t } = useLanguage();
	return (
		<a
			className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:text-foreground focus:outline-2 focus:outline-ring"
			href="#main"
		>
			{t('common.skipToContent')}
		</a>
	);
}
