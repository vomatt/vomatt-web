'use client';

import { m } from 'motion/react';
import { useId } from 'react';

import { Check } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';

// Motion pieces for the paper-ballot metaphor: mark your choice, drop the ballot
// in the box, see it marked as yours. Reduced motion is handled by <MotionProvider>.

// Critically damped: settles without overshoot
const INK = { type: 'spring', stiffness: 520, damping: 46 } as const;

/**
 * The 22px radio circle: a 2px `input` ring at rest; once chosen, ink filled around an 8px Volt dot.
 * The ink is `highlight-foreground`, not `primary`: in dark `primary` is off-white and the dot would vanish into it.
 */
export function BallotMark({ state }: { state: 'rest' | 'selected' }) {
	return (
		<span
			aria-hidden
			className={cn(
				'relative grid size-[22px] shrink-0 place-items-center rounded-full transition-[border-color,background-color] duration-150',
				state === 'rest' ? 'border-2 border-input bg-card' : 'bg-highlight-foreground'
			)}
		>
			{state === 'selected' && (
				<m.span
					className="size-2 rounded-full bg-highlight"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={INK}
				/>
			)}
		</span>
	);
}

/** "your vote": the viewer's option on a result row. Lower-case on purpose. */
export function YourVotePill({ label }: { label: string }) {
	return (
		<m.span
			initial={{ opacity: 0, scale: 0.85 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
			transition={INK}
			className="relative shrink-0 select-none whitespace-nowrap rounded-full border border-highlight-foreground bg-highlight px-2 py-0.5 text-caption-3 font-semibold leading-4 text-highlight-foreground"
		>
			{label}
		</m.span>
	);
}

/** "Voted" in the card header once the viewer's Ballot is in. */
export function VotedPill({ label }: { label: string }) {
	return (
		<m.span
			initial={{ opacity: 0, scale: 0.85 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
			transition={INK}
			className={cn(chipClassName, 'bg-highlight text-caption-4 text-highlight-foreground')}
		>
			<Check aria-hidden size={12} strokeWidth={3} />
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

/** The 1.5px ink line and Volt tint behind the chosen option. Slides between options and dims while a request is out. */
export function SelectionHighlight({ layoutId, inTransit = false }: { layoutId: string; inTransit?: boolean }) {
	return (
		<m.span
			layoutId={layoutId}
			aria-hidden
			className="absolute inset-0 rounded-xl border-[1.5px] border-primary bg-highlight-tint"
			animate={{ opacity: inTransit ? 0.55 : 1 }}
			transition={{ layout: INK, opacity: { duration: 0.15 } }}
		/>
	);
}
