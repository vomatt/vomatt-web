'use client';

import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { formatPollMoment } from '../format';
import { useViewerClock } from '../hooks/useViewerClock';

const MARK_SIZES = {
	sm: { ring: 'size-8', dashed: null, disc: 'size-[13px]', check: 'size-2' },
	md: { ring: 'size-10', dashed: 'inset-[2.5px] border', disc: 'size-[18px]', check: 'size-2.5' },
	lg: { ring: 'size-[72px]', dashed: 'inset-[5px] border-[1.5px]', disc: 'size-[34px]', check: 'size-4' },
};

/**
 * A Tide ring (vomatt's promise) around a Volt check (the voter's own vote). Decorative.
 * sm: 32px, for profile rows and notifications; md: 40px with a dashed inner ring, for the Seal row;
 * lg: 72px with a dashed inner ring, for the Seal moment.
 */
export function SealMark({ size = 'sm' }: { size?: keyof typeof MARK_SIZES }) {
	const { ring, dashed, disc, check } = MARK_SIZES[size];
	return (
		<span
			aria-hidden
			className={cn('relative grid shrink-0 place-items-center rounded-full border-2 border-tide', ring)}
		>
			{dashed && <span className={cn('absolute rounded-full border-dashed border-tide', dashed)} />}
			<span className={cn('grid place-items-center rounded-full bg-highlight text-highlight-foreground', disc)}>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth={3.5}
					strokeLinecap="round"
					strokeLinejoin="round"
					className={check}
				>
					<path d="M5 13l4 4L19 7" />
				</svg>
			</span>
		</span>
	);
}

type SealProps = {
	/** `moment`: in full, right after a cast here. `row`: on later visits. */
	variant: 'moment' | 'row';
	/** When the results open; null for a Poll without an end. */
	endTime: string | null;
	/** Withdraw vote. */
	children: React.ReactNode;
	/** A full-width strip along the bottom of the panel. */
	footer?: React.ReactNode;
};

/** What a cast Ballot becomes: the Seal, saying when the results open, with the vote's actions. */
export function Seal({ variant, endTime, children, footer }: SealProps) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	// The date needs the viewer's time zone, so a dated line holds its space until hydration
	const date = endTime && clock ? formatPollMoment(endTime, clock.language, clock.now) : '';
	const waiting = !!endTime && !clock;
	const line = endTime ? t('poll.sealed', { date }) : t('poll.sealedNoEnd');

	if (variant === 'moment') {
		return (
			<TidePanel>
				<div className="flex flex-col items-center gap-3 px-6 pt-7 pb-6 text-center">
					<span className="mb-1">
						<SealMark size="lg" />
					</span>
					<p className="text-title-3 leading-tight text-foreground">
						{t('poll.sealedTitle')}
					</p>
					<p className={cn('max-w-[420px] text-body-4 leading-5', waiting && 'invisible')}>{line}</p>
					<p className="max-w-[420px] text-body-4 leading-5">{t('poll.changeHint')}</p>
					<div className="mt-1 flex flex-wrap justify-center gap-1.5">{children}</div>
				</div>
				{footer}
			</TidePanel>
		);
	}

	return (
		<TidePanel>
			<div className="flex flex-wrap items-center gap-4 py-3.5 pr-3.5 pl-4">
				<SealMark size="md" />
				<div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
					<p className="text-body-4 font-medium leading-5 text-foreground">{t('poll.sealedTitle')}</p>
					<p className={cn('text-caption-1 leading-snug', waiting && 'invisible')}>{line}</p>
					<p className="text-caption-1 leading-snug">{t('poll.changeHint')}</p>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">{children}</div>
			</div>
			{footer}
		</TidePanel>
	);
}
