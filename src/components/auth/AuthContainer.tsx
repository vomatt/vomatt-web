import cx from 'classnames';
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
			className={cx(
				'relative max-w-md h-[calc(100svh-var(--s-header))] mx-auto w-full flex flex-col justify-center px-5 text-white',
				className
			)}
		>
			{children}
		</motion.div>
	);
}
