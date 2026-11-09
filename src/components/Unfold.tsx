'use client';

import { m, useIsPresent, useReducedMotion } from 'motion/react';

// Reveals ease out over 250ms and leave in 150ms
export const ENTER = { duration: 0.25, ease: 'easeOut' } as const;
export const EXIT = { duration: 0.15, ease: 'easeOut' } as const;

/**
 * Grows content open from nothing and folds it away; put it in an AnimatePresence.
 * It clips with overflow-clip, since overflow-hidden would let focus() scroll it.
 * Focus rings at the edges need room inside the clip, because Safari ignores overflow-clip-margin.
 * So the content sits in a 4px inset, and the box is lifted 4px and pulls up what follows by 8px.
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
				marginBottom: -8,
				transition: { ...ENTER, height: height(ENTER), marginBottom: height(ENTER) },
			}}
			exit={{
				height: 0,
				opacity: 0,
				marginBottom: 0,
				transition: { ...EXIT, height: height(EXIT), marginBottom: height(EXIT) },
			}}
			className="relative -top-1 -mx-1 overflow-clip"
		>
			<div className="p-1">{children}</div>
		</m.div>
	);
}
