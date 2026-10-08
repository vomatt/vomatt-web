'use client';

import { MotionConfig } from 'motion/react';

/** Skips transform and layout animations for people who ask for reduced motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
	return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
