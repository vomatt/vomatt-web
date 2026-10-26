'use client';

import { Clock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';
import { useViewerClock } from '../hooks/useViewerClock';
import type { Poll } from '../schema';
import type { PollStatus } from '../status';
import { pollTiming, statusWord } from '../timing';

const STATUS_TINT: Record<PollStatus, string> = {
	scheduled: 'bg-status-scheduled',
	open: 'bg-status-open',
	closing: 'bg-status-closing',
	ended: 'bg-status-ended',
};

type StatusChipProps = {
	status: PollStatus;
	poll: Pick<Poll, 'startTime' | 'endTime'>;
	/**
	 * `inline`: the chip carries the time ("Open · ends Fri"), for a chip that stands alone (cards,
	 * the creator's review, Explore). `elsewhere`: the chip is the status word ("Open") and the
	 * caller shows `pollTiming(...).when` in its meta line.
	 */
	time: 'inline' | 'elsewhere';
};

/** Tint, an ink dot (a clock while closing) and words, so status never rests on color alone. */
export function StatusChip({ status, poll, time }: StatusChipProps) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	// The word needs no clock, so an `elsewhere` chip renders on the server too
	const label = time === 'elsewhere' ? statusWord(status, t) : clock && pollTiming(poll, status, clock).chip;

	// Times depend on the browser's clock and time zone; hold the chip's
	// height until then so the row doesn't grow after hydration
	if (!label) {
		return <span aria-hidden className={cn(chipClassName, 'invisible')}>&nbsp;</span>;
	}

	return (
		<span className={cn(chipClassName, STATUS_TINT[status])}>
			{status === 'closing' ? (
				<Clock aria-hidden size={10} strokeWidth={3} />
			) : (
				<span aria-hidden className="size-1.5 rounded-full bg-current" />
			)}
			{label}
		</span>
	);
}
