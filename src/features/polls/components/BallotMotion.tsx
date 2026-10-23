'use client';

import { m } from 'motion/react';
import { useId } from 'react';

import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';

// Motion pieces for the paper-ballot metaphor: mark your choice, drop the ballot
// in the box, see it marked as yours. Reduced motion is handled by <MotionProvider>.

// Critically damped: settles without overshoot
const INK = { type: 'spring', stiffness: 520, damping: 46 } as const;

/** A radio circle: polls are single-choice, so a dot fills in when marked. */
export function BallotMark({ checked }: { checked: boolean }) {
	return (
		<span
			aria-hidden
			className={cn(
				'relative grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors duration-150',
				checked ? 'border-primary bg-primary text-highlight dark:border-highlight dark:bg-highlight dark:text-highlight-foreground' : 'border-input bg-card'
			)}
		>
			<m.span
				className="size-2 rounded-full bg-current"
				initial={false}
				animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
				transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
			/>
		</span>
	);
}

/** Marks the option the viewer voted for: a Volt pill whose check draws in. */
export function VotedStamp({ label }: { label: string }) {
	return (
		<m.span
			initial={{ opacity: 0, scale: 0.85 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
			transition={INK}
			className={cn(
				chipClassName,
				'shrink-0 select-none gap-1 border border-foreground/20 bg-highlight pl-2 text-highlight-foreground'
			)}
		>
			<svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden>
				<m.path
					d="M3 8.5 6.5 12 13 4.5"
					stroke="currentColor"
					strokeWidth={2.4}
					strokeLinecap="round"
					strokeLinejoin="round"
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
				/>
			</svg>
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

/** Highlight behind the selected option; slides between options and dims while a request is out. */
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
