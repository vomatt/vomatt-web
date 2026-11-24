'use client';

import { m, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { Check } from '@/components/ui/SvgIcons';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';
import { ElectedMark } from './ElectedMark';

// Motion pieces for the paper-ballot metaphor: mark your choice, drop the ballot
// in the box, see it marked as yours. Reduced motion is handled by <MotionProvider>.

// Critically damped: settles without overshoot
const INK = { type: 'spring', stiffness: 520, damping: 46 } as const;

const MIN_TILT = 6;
const MAX_TILT = 24;

/** A hand-pressed stamp never lands square: `r` in [0, 1) picks a lean of 6° to 24°, left below 0.5 and right above. */
export function stampAngle(r: number) {
	const side = r < 0.5 ? -1 : 1;
	return side * (MIN_TILT + ((r * 2) % 1) * (MAX_TILT - MIN_TILT));
}

function seededUnit(seed: string) {
	let hash = 0;
	for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return (hash % 1000) / 1000;
}

// The angle each option was last pressed at in this tab, so a cast stamp redrawn after Cancel or in another view keeps it
const pressedAngles = new Map<string, number>();

/**
 * The ballot stamp at its own angle, picked once when it mounts so it holds through the cast. A press lands at a random
 * angle and springs in. A vote already cast when it mounts is drawn still, at the angle it was pressed at in this tab or
 * else one taken from the seed, so the server and hydration agree and the mark shows before the JavaScript runs.
 */
function PressedStamp({ seed, pressed }: { seed: string; pressed: boolean }) {
	const hydrated = useHydrated();
	const [{ angle, press }] = useState(() => {
		const press = pressed && hydrated;
		if (press) pressedAngles.set(seed, stampAngle(Math.random()));
		const angle = (hydrated && pressedAngles.get(seed)) || stampAngle(seededUnit(seed));
		return { angle, press };
	});
	return (
		<m.span
			className="absolute inset-0"
			initial={press ? { scale: 1.4, opacity: 0, rotate: angle } : false}
			animate={{ scale: 1, opacity: 1, rotate: angle }}
			transition={INK}
		>
			<ElectedMark className="size-full" />
		</m.span>
	);
}

/** The 22px radio mark: a 2px `input` ring at rest; once chosen, the ballot stamp. `seed` is the option's id. */
export function BallotMark(props: { state: 'rest' } | { state: 'selected' | 'voted'; seed: string }) {
	return (
		<span
			aria-hidden
			data-state={props.state}
			className={cn(
				'relative size-[22px] shrink-0 rounded-full',
				props.state === 'rest' && 'border-2 border-input bg-card'
			)}
		>
			{props.state !== 'rest' && <PressedStamp seed={props.seed} pressed={props.state === 'selected'} />}
		</span>
	);
}

/** "your vote": the viewer's option on a result row. Lower-case on purpose. Pops in when `reveal`, else drawn still. */
export function YourVotePill({ label, reveal }: { label: string; reveal: boolean }) {
	return (
		<m.span
			initial={reveal ? { opacity: 0, scale: 0.95 } : false}
			animate={{ opacity: 1, scale: 1 }}
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
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
			transition={INK}
			className={cn(chipClassName, 'bg-highlight text-highlight-foreground')}
		>
			<Check aria-hidden size={10} strokeWidth={3} />
			{label}
		</m.span>
	);
}

/**
 * The Voted pill's room, held before the vote too, so the pill appearing never squeezes what shares its line.
 * The label is drawn by `::before`, so the space adds no text for queries or screen readers.
 */
export function VotedPillSpace({ label }: { label: string }) {
	return (
		<span aria-hidden data-label={label} className={cn(chipClassName, 'invisible before:content-[attr(data-label)]')}>
			<Check size={10} strokeWidth={3} />
		</span>
	);
}

/** A ballot sliding into the box's slot, played once when the notice appears. */
export function BallotBoxIcon({ className }: { className?: string }) {
	// Many cards render this at once, so the clip path id must be unique
	const clipId = useId();
	const reduceMotion = useReducedMotion();
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
					initial={reduceMotion ? false : { y: -2 }}
					animate={{ y: reduceMotion ? 2 : 12 }}
					transition={{ duration: 0.55, ease: [0.5, 0, 0.75, 0], delay: 0.1 }}
				/>
			</g>
			<rect x="3.5" y="11" width="17" height="9.5" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
			<path d="M8 11h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
		</svg>
	);
}

/** The 1.5px chosen line and Volt tint behind the chosen option. Slides between options and dims while a request is out. */
export function SelectionHighlight({ layoutId, inTransit = false }: { layoutId: string; inTransit?: boolean }) {
	return (
		<m.span
			layoutId={layoutId}
			aria-hidden
			className="absolute inset-0 rounded-xl border-[1.5px] border-chosen-line bg-highlight-tint"
			animate={{ opacity: inTransit ? 0.55 : 1 }}
			transition={{ layout: INK, opacity: { duration: 0.15 } }}
		/>
	);
}
