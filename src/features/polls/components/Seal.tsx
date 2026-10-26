'use client';

import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { rich } from '@/lib/rich';
import { cn } from '@/lib/utils';

import { formatPollMoment } from '../format';
import { useViewerClock } from '../hooks/useViewerClock';
import type { VisibilityLevel } from '../status';

/**
 * A Tide ring (vomatt's promise) around a Volt check (the voter's own vote). Decorative.
 * sm: 32px, for rows (the Seal row, profile rows, notifications); lg: 72px with a dashed inner ring, for the full Seal.
 */
export function SealMark({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
	const isLarge = size === 'lg';
	return (
		<span
			aria-hidden
			className={cn(
				'relative grid shrink-0 place-items-center rounded-full border-2 border-tide',
				isLarge ? 'size-[72px]' : 'size-8'
			)}
		>
			{isLarge && <span className="absolute inset-1.5 rounded-full border border-dashed border-tide" />}
			<span
				className={cn(
					'grid place-items-center rounded-full bg-highlight text-highlight-foreground',
					isLarge ? 'size-[30px]' : 'size-[13px]'
				)}
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={3.5}
					strokeLinecap="round"
					strokeLinejoin="round"
					className={isLarge ? 'size-4' : 'size-2'}
				>
					<path d="M5 13l4 4L19 7" />
				</svg>
			</span>
		</span>
	);
}

type SealProps = {
	/** In full right after a cast; a compact row on later visits. */
	full: boolean;
	/** When the results open; null for a Poll without an end. */
	endTime: string | null;
	/** Who sees the choice once the Poll ends; only the full Seal says it. */
	visibility: VisibilityLevel;
	turnout?: number;
};

/** What a cast Ballot becomes: the Seal, with when the results open and, in full, who will see the choice. */
export function Seal({ full, endTime, visibility, turnout }: SealProps) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	// The date needs the viewer's time zone, so a dated line holds its space until hydration
	const date = endTime && clock ? formatPollMoment(endTime, clock.language, clock.now) : '';
	const waiting = !!endTime && !clock;

	if (full) {
		return (
			<TidePanel className="flex flex-col items-center gap-1.5 px-4 py-5 text-center text-[14px] leading-relaxed">
				<SealMark size="lg" />
				<p className="mt-2 text-[18px] font-medium tracking-[-0.01em] text-foreground">
					{t('poll.sealedTitle')}
				</p>
				<p className={cn(waiting && 'invisible')}>
					{endTime ? t('poll.sealed', { date }) : t('poll.revealHint')}
				</p>
				<p>{t(`poll.visibility.${visibility}`)}</p>
				{turnout !== undefined && (
					<p className="mt-1 font-mono text-[13px] text-foreground tabular-nums">
						{t('poll.sealedTurnout', { count: turnout.toLocaleString() })}
					</p>
				)}
			</TidePanel>
		);
	}

	return (
		<TidePanel className="flex items-center gap-3.5 px-3.5 py-3 text-[13px] leading-snug">
			<SealMark />
			<p className={cn('min-w-0', waiting && 'invisible')}>
				{rich(t(endTime ? 'poll.sealedRow' : 'poll.sealedRowNoEnd'), {
					sealed: <strong className="font-medium">{t('poll.sealedWord')}</strong>,
					date,
				})}
			</p>
		</TidePanel>
	);
}
