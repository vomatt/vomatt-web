import clsx from 'clsx';
import { motion } from 'motion/react';

import { fadeAnim } from '@/lib/animate';

export type AuthContainerType = {
	type: string;
	className?: string;
	children: React.ReactNode;
};

export default function AuthContainer({
	type,
	className,
	children,
}: AuthContainerType) {
	return (
		<motion.div
			key={type}
			initial="hide"
			animate="show"
			exit="hide"
			variants={fadeAnim}
			className={clsx('relative max-w-xs h-dvh mx-auto w-full', className)}
		>
			{children}
		</motion.div>
	);
}
