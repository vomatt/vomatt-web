'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';
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

	// Labels depend on the browser's clock and time zone; hold the chip's
	// height until then so the row doesn't grow after hydration
	if (!isHydrated) {
		return <span aria-hidden className={cn(chipClassName, 'invisible')}>&nbsp;</span>;
	}

	return (
		<span className={cn(chipClassName, STATUS_TINT[status])}>{label}</span>
	);
}
