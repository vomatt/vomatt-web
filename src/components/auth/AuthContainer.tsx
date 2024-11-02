import cx from 'classnames';
import { motion } from 'framer-motion';

import { fadeAnim } from '@/lib/animate';

export const STATUS_SIGN_IN = 'STATUS_SIGN_IN';
export const STATUS_VERIFICATION = 'STATUS_VERIFICATION';
export type PageStatusType = 'STATUS_SIGN_IN' | 'STATUS_VERIFICATION';

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
				'relative max-w-md h-[calc(100svh_-_var(--s-header))] mx-auto w-full flex flex-col justify-center px-contain',
				className
			)}
		>
			{children}
		</motion.div>
	);
}
