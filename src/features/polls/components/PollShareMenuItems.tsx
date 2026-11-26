'use client';

import { Menu } from '@base-ui/react/menu';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

import { menuItemClassName } from '@/components/ui/menu';
import { QrCode } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackEvent } from '@/lib/analytics';

/** Opened by `onShowQr`; loaded then, so lists of polls don't carry the QR encoder. */
export const PollQrDialog = dynamic(() => import('./PollQrDialog').then((m) => m.PollQrDialog));

/** Show QR code, for a poll's ••• menu. Render inside the `Menu.Popup`, which only mounts in the browser. */
export function PollShareMenuItems({ onShowQr }: { onShowQr: () => void }) {
	const { t } = useLanguage();
	// The menu is open: fetch the dialog now, so Show QR code opens at once
	useEffect(() => {
		void import('./PollQrDialog');
	}, []);

	return (
		<Menu.Item
			onClick={() => {
				trackEvent('poll_shared', { channel: 'QR' });
				onShowQr();
			}}
			className={menuItemClassName}
		>
			<QrCode aria-hidden />
			{t('poll.showQr')}
		</Menu.Item>
	);
}
