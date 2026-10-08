'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { cn } from '@/lib/utils';

// Motion pieces for the paper-ballot metaphor: mark a box, drop the ballot
// in the box, get it stamped. Reduced motion is handled by <MotionProvider>.

const INK = { type: 'spring', stiffness: 520, damping: 32 } as const;

/** The square on a paper ballot; a check is drawn in when marked. */
export function BallotMark({ checked }: { checked: boolean }) {
	return (
		<span
			aria-hidden
			className={cn(
				'relative grid size-[18px] shrink-0 place-items-center rounded-[4px] border-[1.5px] transition-colors duration-150',
				checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40 bg-card'
			)}
		>
			<svg viewBox="0 0 16 16" className="size-3" fill="none">
				<motion.path
					d="M3 8.5 6.5 12 13 4.5"
					stroke="currentColor"
					strokeWidth={2.2}
					strokeLinecap="round"
					strokeLinejoin="round"
					initial={false}
					animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
					transition={{ duration: 0.22, ease: 'easeOut' }}
				/>
			</svg>
		</span>
	);
}

/** A rubber stamp pressed onto the chosen option. */
export function VotedStamp({ label }: { label: string }) {
	return (
		<motion.span
			initial={{ opacity: 0, scale: 1.8, rotate: -24 }}
			animate={{ opacity: 1, scale: 1, rotate: -8 }}
			exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
			transition={{ type: 'spring', stiffness: 600, damping: 18, mass: 0.6 }}
			className="inline-flex shrink-0 select-none items-center rounded-[5px] border-2 border-primary/80 px-1.5 py-px font-mono text-[10px] font-bold uppercase tracking-wider text-primary/90"
		>
			{label}
		</motion.span>
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
				<motion.rect
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

/** Highlight behind the selected option; slides between options. */
export function SelectionHighlight({ layoutId }: { layoutId: string }) {
	return (
		<motion.span
			layoutId={layoutId}
			aria-hidden
			className="absolute inset-0 rounded-lg border border-primary bg-primary/[0.06]"
			transition={INK}
		/>
	);
}
