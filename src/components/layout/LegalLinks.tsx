'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { aboutHref } from '@/lib/aboutSite';

const LEGAL_LINKS = [
	{ slug: 'terms-of-service', labelKey: 'settings.terms' },
	{ slug: 'privacy-policy', labelKey: 'settings.privacyPolicy' },
	{ slug: 'cookies-policy', labelKey: 'settings.cookies' },
];

export function LegalLinks({ className }: { className?: string }) {
	const { t } = useLanguage();
	return (
		<nav aria-label={t('settings.legal')} className={className}>
			{LEGAL_LINKS.map(({ slug, labelKey }) => (
				<a key={slug} href={aboutHref(slug)} className="hover:text-foreground">
					{t(labelKey)}
				</a>
			))}
		</nav>
	);
}
