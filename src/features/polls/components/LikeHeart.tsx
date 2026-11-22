'use client';

import { useAnimate, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { Heart } from '@/components/ui/SvgIcons';
import { EASE_OUT_STRONG } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** The like heart: fills when liked and gives a small pop when the viewer likes it (never on load). */
export function LikeHeart({ liked, className, strokeWidth }: { liked: boolean; className?: string; strokeWidth?: number }) {
	const [scope, animate] = useAnimate<HTMLSpanElement>();
	const reduceMotion = useReducedMotion();
	const previous = useRef(liked);
	useEffect(() => {
		const wasLiked = previous.current;
		previous.current = liked;
		if (!liked || wasLiked || reduceMotion) return;
		// From wherever it is now, so quick toggles never restart from the bottom
		animate(scope.current, { transform: [null, 'scale(0.85)', 'scale(1)'] }, { duration: 0.2, ease: EASE_OUT_STRONG });
	}, [liked, reduceMotion, animate, scope]);
	return (
		<span ref={scope} className="inline-flex">
			<Heart aria-hidden className={cn(className, liked && 'fill-current')} strokeWidth={strokeWidth} />
		</span>
	);
}
