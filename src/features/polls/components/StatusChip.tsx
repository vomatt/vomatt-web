'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow, formatPollDate } from '../format';
import type { Poll } from '../schema';
import type { PollStatus } from '../status';

const STATUS_TINT: Record<PollStatus, string> = {
	scheduled: 'bg-status-scheduled',
	open: 'bg-status-open',
	closing: 'bg-status-closing',
	ended: 'bg-status-ended',
};

type StatusChipProps = {
	status: PollStatus;
	poll: Pick<Poll, 'startTime' | 'endTime'>;
};

export function StatusChip({ status, poll }: StatusChipProps) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const { startTime, endTime } = poll;

	// Labels depend on the browser's clock and time zone
	if (!isHydrated) return null;

	let label: string;
	if (status === 'scheduled') {
		label = t('poll.chipOpens', { date: formatPollDate(startTime, currentLanguage) });
	} else if (status === 'ended') {
		label = endTime
			? t('poll.chipEnded', { date: formatPollDate(endTime, currentLanguage) })
			: t('poll.chipEndedShort');
	} else if (!endTime) {
		return null;
	} else if (status === 'closing') {
		label = t('poll.chipEndsIn', { distance: formatFromNow(endTime, currentLanguage) });
	} else {
		label = t('poll.chipEnds', { date: formatPollDate(endTime, currentLanguage) });
	}

	return (
		<span
			className={cn(
				'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-foreground',
				STATUS_TINT[status]
			)}
		>
			{label}
		</span>
	);
}
