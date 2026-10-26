'use client';

import { m } from 'motion/react';
import { useId } from 'react';

import { cn } from '@/lib/utils';

// Motion pieces for the paper-ballot metaphor: mark your choice, drop the ballot
// in the box, see it marked as yours. Reduced motion is handled by <MotionProvider>.

// Critically damped: settles without overshoot
const INK = { type: 'spring', stiffness: 520, damping: 46 } as const;

export type MarkState = 'rest' | 'selected' | 'cast';

/**
 * The 20px radio circle. rest: a 1.5px `input` ring (`border-strong` once `quiet`, beside a cast
 * vote); selected: a 6px ink ring; cast: Volt filled, with an ink line and an ink check that draws in.
 * Selection is border weight, not colour: only the cast vote earns Volt.
 */
export function BallotMark({ state, quiet = false }: { state: MarkState; quiet?: boolean }) {
	return (
		<span
			aria-hidden
			className={cn(
				'relative grid size-5 shrink-0 place-items-center rounded-full transition-[border-width,border-color,background-color] duration-150',
				state === 'rest' && cn('border-[1.5px] bg-card', quiet ? 'border-border-strong' : 'border-input'),
				state === 'selected' && 'border-[6px] border-primary bg-card',
				// Ink on Volt in both themes
				state === 'cast' && 'border-[1.5px] border-highlight-foreground bg-highlight text-highlight-foreground'
			)}
		>
			{state === 'cast' && (
				<svg viewBox="0 0 24 24" className="size-[11px]" fill="none">
					<m.path
						d="M5 13l4 4L19 7"
						stroke="currentColor"
						strokeWidth={3.5}
						strokeLinecap="round"
						strokeLinejoin="round"
						initial={{ pathLength: 0 }}
						animate={{ pathLength: 1 }}
						transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
					/>
				</svg>
			)}
		</span>
	);
}

/** "your vote": the viewer's cast option, on a ballot row and a result row. Lower-case on purpose. */
export function YourVotePill({ label }: { label: string }) {
	return (
		<m.span
			initial={{ opacity: 0, scale: 0.85 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
			transition={INK}
			className="relative shrink-0 select-none whitespace-nowrap rounded-full border border-highlight-foreground bg-highlight px-2 py-0.5 text-[11px] font-semibold leading-4 text-highlight-foreground"
		>
			{label}
		</m.span>
	);
}

/** A ballot sliding into the box's slot, played once when the notice appears. */
export function BallotBoxIcon({ className }: { className?: string }) {
	// Many cards render this at once, so the clip path id must be unique
	const clipId = useId();
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn('size-5 shrink-0', className)}>
			<defs>
				<clipPath id={clipId}>
					<rect x="0" y="0" width="24" height="12" />
				</clipPath>
			</defs>
			<g clipPath={`url(#${clipId})`}>
				<m.rect
					x="8"
					width="8"
					height="9"
					rx="1"
					fill="currentColor"
					opacity={0.35}
					initial={{ y: -2 }}
					animate={{ y: 12 }}
					transition={{ duration: 0.55, ease: [0.5, 0, 0.75, 0], delay: 0.1 }}
				/>
			</g>
			<rect x="3.5" y="11" width="17" height="9.5" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
			<path d="M8 11h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
		</svg>
	);
}

/**
 * The 1.5px ink line behind the selected option, with the Volt tint only once it is the cast vote.
 * Slides between options and dims while a request is out.
 */
export function SelectionHighlight({
	layoutId,
	inTransit = false,
	cast,
}: {
	layoutId: string;
	inTransit?: boolean;
	cast: boolean;
}) {
	return (
		<m.span
			layoutId={layoutId}
			aria-hidden
			className={cn('absolute inset-0 rounded-xl border-[1.5px] border-primary', cast && 'bg-highlight-tint')}
			animate={{ opacity: inTransit ? 0.55 : 1 }}
			transition={{ layout: INK, opacity: { duration: 0.15 } }}
		/>
	);
}
