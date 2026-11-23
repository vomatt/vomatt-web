'use client';

import { Menu } from '@base-ui/react/menu';
import dynamic from 'next/dynamic';

import { menuItemClassName } from '@/components/ui/menu';
import { ArrowUpRight, QrCode } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { settle } from '@/lib/api/settle';

import { sharePoll } from '../service';
import { pollUrl } from '../url';

/** Opened by `onShowQr`; loaded then, so lists of polls don't carry the QR encoder. */
export const PollQrDialog = dynamic(() => import('./PollQrDialog').then((m) => m.PollQrDialog));

const LINE_SHARE_URL = 'https://social-plugins.line.me/lineit/share';

/** Show QR code and Share on LINE, for a poll's ••• menu. Render inside the `Menu.Popup`, which only mounts in the browser. */
export function PollShareMenuItems({ pollId, onShowQr }: { pollId: string; onShowQr: () => void }) {
	const { t } = useLanguage();

	return (
		<>
			<Menu.Item onClick={onShowQr} className={menuItemClassName}>
				<QrCode aria-hidden />
				{t('poll.showQr')}
			</Menu.Item>
			<Menu.LinkItem
				href={`${LINE_SHARE_URL}?url=${encodeURIComponent(pollUrl(pollId))}`}
				target="_blank"
				rel="noopener noreferrer"
				// Counted like the other shares; a failure (e.g. signed out) is ignored
				onClick={() => void settle(sharePoll(pollId, 'LINE'))}
				className={menuItemClassName}
			>
				<ArrowUpRight aria-hidden />
				{t('poll.shareOnLine')}
			</Menu.LinkItem>
		</>
	);
}
