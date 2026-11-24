'use client';

import { m, useIsPresent, useReducedMotion } from 'motion/react';

import { EASE_OUT_STRONG } from '@/lib/motion';

// Reveals ease out (the strong curve) over 250ms and leave in 150ms
export const ENTER = { duration: 0.25, ease: EASE_OUT_STRONG } as const;
export const EXIT = { duration: 0.15, ease: EASE_OUT_STRONG } as const;

/**
 * Grows content open from nothing and folds it away; put it in an AnimatePresence.
 * It clips with overflow-clip, since overflow-hidden would let focus() scroll it.
 * Focus rings at the edges need room inside the clip, because Safari ignores overflow-clip-margin.
 * So the content sits in an 8px inset, and the box is lifted 8px and pulls up what follows by 16px.
 * The inset also leaves room for a linked comment's flash, which reaches 8px past the comment.
 * The inset lets taps through, since the lifted box lies over the bottom of what comes before it.
 * Only the bottom margin is negative, so it can't collapse into a neighbour's and double up.
 * Under reduced motion only the fade remains.
 * While it folds away it is inert, so it can't be clicked or typed into on its way out.
 */
export function Unfold({ children }: { children: React.ReactNode }) {
	const reduceMotion = useReducedMotion();
	const isPresent = useIsPresent();
	const height = (timing: typeof ENTER | typeof EXIT) => ({
		...timing,
		duration: reduceMotion ? 0 : timing.duration,
	});
	return (
		<m.div
			inert={!isPresent}
			// The margin folds with the height, so a closed Unfold takes no room
			initial={{ height: 0, opacity: 0, marginBottom: 0 }}
			animate={{
				height: 'auto',
				opacity: 1,
				marginBottom: -16,
				transition: { ...ENTER, height: height(ENTER), marginBottom: height(ENTER) },
			}}
			exit={{
				height: 0,
				opacity: 0,
				marginBottom: 0,
				transition: { ...EXIT, height: height(EXIT), marginBottom: height(EXIT) },
			}}
			className="pointer-events-none relative -top-2 -mx-2 overflow-clip"
		>
			<div className="p-2 *:pointer-events-auto">{children}</div>
		</m.div>
	);
}
