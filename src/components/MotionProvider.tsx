'use client';

import { domMax, LazyMotion, MotionConfig } from 'motion/react';

/**
 * Animation features ship with the page so elements that start hidden appear on hydration, not after
 * another chunk. domMax, not domAnimation: the ballot highlight uses layoutId. Use `m.*`, not `motion.*`
 * (strict mode throws on the latter). Skips transform and layout animations for people who ask for reduced motion.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
	return (
		<LazyMotion features={domMax} strict>
			<MotionConfig reducedMotion="user">{children}</MotionConfig>
		</LazyMotion>
	);
}
