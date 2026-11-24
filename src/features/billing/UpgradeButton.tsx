'use client';

import { type ComponentProps } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackEvent } from '@/lib/analytics';

/** Upgrade to Pro: paid plans aren't open (the API has no billing endpoints yet; an admin sets the plan), so this says it's coming soon. */
export function UpgradeButton(props: Omit<ComponentProps<typeof Button>, 'onClick' | 'loading' | 'children'>) {
	const { t } = useLanguage();

	return (
		<Button
			size="md"
			{...props}
			onClick={() => {
				trackEvent('upgrade_clicked', {});
				toast.info(t('plan.comingSoon'));
			}}
		>
			{t('plan.upgrade')}
		</Button>
	);
}
