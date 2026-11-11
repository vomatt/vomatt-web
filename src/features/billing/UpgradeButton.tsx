'use client';

import { type ComponentProps, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';

import { startCheckout } from './service';

/** Upgrade to Pro: off to the payment page, or a coming-soon note while paid plans aren't open. */
export function UpgradeButton(props: Omit<ComponentProps<typeof Button>, 'onClick' | 'loading' | 'children'>) {
	const { t } = useLanguage();
	const [busy, setBusy] = useState(false);

	const upgrade = async () => {
		setBusy(true);
		const result = await startCheckout();
		if (result.ok) {
			window.location.assign(result.data);
			return;
		}
		setBusy(false);
		if (result.errorCode === 'billing.unavailable') toast.info(t('plan.comingSoon'));
		else toast.error(apiErrorText(t, result, 'plan.upgradeFailed'));
	};

	return (
		<Button size="md" {...props} loading={busy} onClick={upgrade}>
			{t('plan.upgrade')}
		</Button>
	);
}
