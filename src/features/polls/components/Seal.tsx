'use client';

import { m } from 'motion/react';

import { Lock } from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { formatPollMoment } from '../format';
import { useViewerClock } from '../hooks/useViewerClock';

const MARK_SIZES = {
	sm: { ring: 'size-8', dashed: null, disc: 'size-[13px]', check: 'size-2' },
	md: {
		ring: 'size-8 md:size-10',
		dashed: 'inset-[2px] border md:inset-[2.5px]',
		disc: 'size-[13px] md:size-[18px]',
		check: 'size-2 md:size-2.5',
	},
};

/**
 * A Tide ring (vomatt's promise) around a Volt check (the voter's own vote). Decorative.
 * sm: 32px, for profile rows and notifications; md: a dashed inner ring for the Seal, 32px on phones and 40px from md.
 */
export function SealMark({ size = 'sm' }: { size?: keyof typeof MARK_SIZES }) {
	const { ring, dashed, disc, check } = MARK_SIZES[size];
	return (
		<span
			aria-hidden
			className={cn(
				'relative grid shrink-0 place-items-center rounded-full border-2 border-tide',
				ring
			)}
		>
			{dashed && (
				<span
					className={cn(
						'absolute rounded-full border-dashed border-tide',
						dashed
					)}
				/>
			)}
			<span
				className={cn(
					'grid place-items-center rounded-full bg-highlight text-highlight-foreground',
					disc
				)}
			>
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
	/** Casts saved on this screen: each new one pops the mark in. 0 (a later visit) draws it still. */
	popKey?: number;
	/** When the results open; null for a Poll without an end. */
	endTime: string | null;
	/** Withdraw vote. */
	children: React.ReactNode;
};

/** An Ended Poll whose counts stay sealed until its `revealAt`, for every viewer; Turnout shows in the footer. */
export function SealedUntilReveal({ revealAt }: { revealAt: string }) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	// The date needs the viewer's time zone, so the line holds its space until hydration
	const date = clock
		? formatPollMoment(revealAt, clock.language, clock.now)
		: '';
	return (
		<TidePanel>
			{/* A Tide lock, not the SealMark: its Volt check means the viewer's own vote */}
			<div className="flex items-center gap-3 py-3.5 pr-3.5 pl-4">
				<Lock aria-hidden className="size-[18px] shrink-0 text-tide" />
				<p
					className={cn(
						'text-body-4 font-medium leading-5 text-foreground',
						!clock && 'invisible'
					)}
				>
					{t('poll.sealedUntilReveal', { date })}
				</p>
			</div>
		</TidePanel>
	);
}

/** What a cast Ballot becomes: the Seal, saying when the results open, with the vote's actions. */
export function Seal({ popKey = 0, endTime, children }: SealProps) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	// The date needs the viewer's time zone, so until hydration the title says only that the vote is sealed
	const line = !endTime
		? t('poll.sealedNoEnd')
		: clock
			? t('poll.sealed', {
					date: formatPollMoment(endTime, clock.language, clock.now),
				})
			: t('poll.sealedShort');

	return (
		<TidePanel>
			<div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 py-2.5 pr-3.5 pl-3.5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-4 md:pl-4">
				<m.span
					key={popKey}
					className="row-span-2 md:row-span-1"
					initial={popKey ? { scale: 0.4, opacity: 0 } : false}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: 'spring', stiffness: 420, damping: 18 }}
				>
					<SealMark size="md" />
				</m.span>
				{/* Two lines, no more: every line the Seal has is room an unvoted card keeps empty above its divider */}
				<div className="flex flex-col gap-0.5">
					<p className="text-body-4 font-medium leading-5 text-foreground">
						{line}
					</p>
					<p className="text-caption-1 leading-snug text-pretty">
						{t('poll.changeHint')}
					</p>
				</div>
				{/* A column of its own, so no line of text runs up against it. Phones have no room for one: there it sits
				    under the text, which frees the title's line instead. The margins keep the 44px target off the lines */}
				<div className="-my-2 -ml-2 flex items-center gap-1.5 justify-self-start md:-my-3 md:-mr-2 md:ml-0">
					{children}
				</div>
			</div>
		</TidePanel>
	);
}
