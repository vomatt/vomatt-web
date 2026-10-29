'use client';

import Link from 'next/link';

import { useLanguage } from '@/contexts/LanguageContext';

const LEGAL_LINKS = [
	{ href: '/terms-of-service', labelKey: 'settings.terms' },
	{ href: '/privacy-policy', labelKey: 'settings.privacyPolicy' },
	{ href: '/cookies-policy', labelKey: 'settings.cookies' },
];

export function LegalLinks({ className }: { className?: string }) {
	const { t } = useLanguage();
	return (
		<nav aria-label={t('settings.legal')} className={className}>
			{LEGAL_LINKS.map(({ href, labelKey }) => (
				<Link key={href} href={href} className="hover:text-foreground">
					{t(labelKey)}
				</Link>
			))}
		</nav>
	);
}
