'use client';

import type { Variants } from 'motion/react';
import { motion, useAnimation } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

import { cn } from '@/lib/utils';

export interface MailCheckIconHandle {
	startAnimation: () => void;
	stopAnimation: () => void;
}

interface MailCheckIconProps extends HTMLAttributes<HTMLDivElement> {}

const checkVariants: Variants = {
	normal: {
		pathLength: 1,
		opacity: 1,
		transition: {
			duration: 0.3,
		},
	},
	animate: {
		pathLength: [0, 1],
		opacity: [0, 1],
		transition: {
			pathLength: { duration: 0.4, ease: 'easeInOut' },
			opacity: { duration: 0.4, ease: 'easeInOut' },
		},
	},
};

const MailCheckIcon = forwardRef<MailCheckIconHandle, MailCheckIconProps>(
	({ onMouseEnter, onMouseLeave, className, ...props }, ref) => {
		const controls = useAnimation();
		const isControlledRef = useRef(false);

		useImperativeHandle(ref, () => {
			isControlledRef.current = true;

			return {
				startAnimation: () => controls.start('animate'),
				stopAnimation: () => controls.start('normal'),
			};
		});

		const handleMouseEnter = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				if (!isControlledRef.current) {
					controls.start('animate');
				} else {
					onMouseEnter?.(e);
				}
			},
			[controls, onMouseEnter]
		);

		const handleMouseLeave = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				if (!isControlledRef.current) {
					controls.start('normal');
				} else {
					onMouseLeave?.(e);
				}
			},
			[controls, onMouseLeave]
		);

		return (
			<div
				className={cn(className)}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				{...props}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
					<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
					<motion.path
						animate={controls}
						initial="normal"
						variants={checkVariants}
						d="m16 19 2 2 4-4"
						style={{ transformOrigin: 'center' }}
					/>
				</svg>
			</div>
		);
	}
);

MailCheckIcon.displayName = 'MailCheckIcon';

export { MailCheckIcon };
