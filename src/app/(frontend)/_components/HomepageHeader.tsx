'use client';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

export function HomepageHeader() {
	const { t } = useLanguage();
	return (
		<nav className="flex justify-center sticky top-0 z-10 bg-black/80 backdrop-blur-3xl">
			<Button asChild variant="ghost">
				<Link href="/">{t('common.home')}</Link>
			</Button>
		</nav>
	);
}
