'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow, formatPollDate } from '../format';
import type { Poll } from '../schema';
import type { PollStatus } from '../status';

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
				'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium',
				status === 'open' && 'text-emerald-600 dark:text-emerald-400',
				status === 'closing' && 'text-amber-600 dark:text-amber-400',
				status === 'scheduled' && 'text-sky-600 dark:text-sky-400',
				status === 'ended' && 'text-muted-foreground'
			)}
		>
			{(status === 'open' || status === 'closing') && (
				<span aria-hidden className="relative size-1.5">
					{status === 'closing' && (
						<span className="absolute inset-0 rounded-full bg-current opacity-60 motion-safe:animate-ping motion-safe:[animation-duration:1.2s]" />
					)}
					<span className="relative block size-1.5 rounded-full bg-current" />
				</span>
			)}
			{label}
		</span>
	);
}
