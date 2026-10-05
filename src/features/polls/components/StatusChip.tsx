'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { fill, formatFromNow, formatPollDate } from '../format';
import type { Poll } from '../schema';
import type { PollStatus } from '../status';

type StatusChipProps = {
	status: PollStatus;
	poll: Pick<Poll, 'startTime' | 'endTime'>;
};

export function StatusChip({ status, poll }: StatusChipProps) {
	const { t, currentLanguage } = useLanguage();
	const { startTime, endTime } = poll;

	let label: string;
	if (status === 'scheduled') {
		label = fill(t('poll.chipOpens'), { date: formatPollDate(startTime, currentLanguage) });
	} else if (status === 'ended') {
		label = endTime
			? fill(t('poll.chipEnded'), { date: formatPollDate(endTime, currentLanguage) })
			: t('poll.chipEndedShort');
	} else if (!endTime) {
		return null;
	} else if (status === 'closing') {
		label = fill(t('poll.chipEndsIn'), { distance: formatFromNow(endTime, currentLanguage) });
	} else {
		label = fill(t('poll.chipEnds'), { date: formatPollDate(endTime, currentLanguage) });
	}

	return (
		<span
			suppressHydrationWarning
			className={cn(
				'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium',
				status === 'open' && 'text-emerald-600 dark:text-emerald-400',
				status === 'closing' && 'text-amber-600 dark:text-amber-400',
				status === 'scheduled' && 'text-sky-600 dark:text-sky-400',
				status === 'ended' && 'text-muted-foreground'
			)}
		>
			{(status === 'open' || status === 'closing') && (
				<span aria-hidden className="size-1.5 rounded-full bg-current" />
			)}
			{label}
		</span>
	);
}
