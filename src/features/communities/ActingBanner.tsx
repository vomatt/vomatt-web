'use client';

import { usePathname } from 'next/navigation';

import { useLanguage } from '@/contexts/LanguageContext';
import { isChromeless } from '@/lib/routes';

import { SwitchBackButton, useActing } from './ActingProvider';
import { accountName } from './schema';

/** A band over every page while acting, so nobody posts as the community by mistake. Also the way back on phones. */
export function ActingBanner() {
	const { t } = useLanguage();
	const pathname = usePathname();
	const { acting } = useActing();
	if (!acting || isChromeless(pathname)) return null;

	return (
		<div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-primary px-4 py-2.5 text-caption-1 text-primary-foreground md:px-6">
			<p className="min-w-0 flex-1">
				{t('communities.acting.banner', { name: accountName(acting) })}
			</p>
			<SwitchBackButton
				size="xs"
				variant="outline"
				className="shrink-0 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
			/>
		</div>
	);
}
