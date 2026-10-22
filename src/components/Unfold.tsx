'use client';

import { m, useIsPresent, useReducedMotion } from 'motion/react';

// Reveals ease out over 250ms and leave in 150ms
export const ENTER = { duration: 0.25, ease: 'easeOut' } as const;
export const EXIT = { duration: 0.15, ease: 'easeOut' } as const;

/**
 * Grows content open from nothing and folds it away; put it in an AnimatePresence.
 * It clips (not overflow-hidden, which focus() could scroll), and the 4px inset and clip margin
 * leave room for focus rings at the edges. Under reduced motion only the fade remains.
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
			initial={{ height: 0, opacity: 0 }}
			animate={{ height: 'auto', opacity: 1, transition: { ...ENTER, height: height(ENTER) } }}
			exit={{ height: 0, opacity: 0, transition: { ...EXIT, height: height(EXIT) } }}
			className="-mx-1 overflow-clip px-1 [overflow-clip-margin:4px]"
		>
			{children}
		</m.div>
	);
}
