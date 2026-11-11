'use client';

import { usePathname } from 'next/navigation';

import { useLanguage } from '@/contexts/LanguageContext';
import { rich } from '@/lib/rich';
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
		<div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-primary/6 px-4 py-2.5 text-caption-1 text-foreground md:px-6">
			<p className="min-w-0 flex-1">
				{rich(t(acting.locked ? 'communities.acting.bannerLocked' : 'communities.acting.banner'), {
					name: <strong className="font-semibold">{accountName(acting)}</strong>,
				})}
			</p>
			<SwitchBackButton size="xs" variant="outline" className="shrink-0" />
		</div>
	);
}
