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
	 * `inline`: the chip carries the time ("Ends Fri 20:00"), for a chip that stands alone (cards,
	 * the creator's review, Explore). `elsewhere`: the chip is the status word ("Open") and the
	 * caller shows `pollTiming(...).when` in its meta line.
	 */
	time: 'inline' | 'elsewhere';
	/** On a poll card the chip is 10px, and a poll still taking votes gets the pink tint without a mark. */
	onCard?: boolean;
};

/** Tint, an ink dot (a clock while closing) and words, so status never rests on color alone. */
export function StatusChip({ status, poll, time, onCard = false }: StatusChipProps) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	// The word needs no clock, so an `elsewhere` chip renders on the server too
	const label = time === 'elsewhere' ? statusWord(status, t) : clock && pollTiming(poll, status, clock).chip;
	const size = onCard && 'text-[10px]';

	// Times depend on the browser's clock and time zone; hold the chip's
	// height until then so the row doesn't grow after hydration
	if (!label) {
		return <span aria-hidden className={cn(chipClassName, size, 'invisible')}>&nbsp;</span>;
	}

	if (onCard && (status === 'open' || status === 'closing')) {
		return <span className={cn(chipClassName, size, 'bg-status-open-ends')}>{label}</span>;
	}

	return (
		<span className={cn(chipClassName, size, STATUS_TINT[status])}>
			{status === 'closing' ? (
				<Clock aria-hidden size={10} strokeWidth={3} />
			) : (
				<span aria-hidden className="size-1.5 rounded-full bg-current" />
			)}
			{label}
		</span>
	);
}
