'use client';

import { encode } from 'uqr';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Copy } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';

import { useCopyPollLink } from '../hooks/useSharePoll';
import { pollUrl } from '../url';

/** Blank modules a scanner needs around the code. */
const QUIET_ZONE = 4;

/** A Poll's link as a QR code to scan from this screen, with the link to copy. */
export function PollQrDialog({
	pollId,
	title,
	open,
	onOpenChange,
}: {
	pollId: string;
	title: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useLanguage();
	const copyLink = useCopyPollLink();
	const { size, data } = encode(pollUrl(pollId), { border: QUIET_ZONE });
	const modules = data.flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : ''))).join('');

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent closeLabel={t('common.close')}>
				<DialogHeader className="pr-12">
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{t('poll.qrHint')}</DialogDescription>
				</DialogHeader>
				<DialogBody className="flex justify-center">
					{/* Its own black on white in both themes: scanners read dark modules on a light ground */}
					<svg
						role="img"
						aria-label={t('poll.qrLabel')}
						viewBox={`0 0 ${size} ${size}`}
						shapeRendering="crispEdges"
						className="size-64 rounded-xl"
					>
						<rect width={size} height={size} fill="#fff" />
						<path fill="#000" d={modules} />
					</svg>
				</DialogBody>
				<DialogFooter>
					<Button size="md" variant="outline" onClick={() => copyLink(pollId)}>
						<Copy aria-hidden />
						{t('poll.copyLink')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
