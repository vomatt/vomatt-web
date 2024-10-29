import cx from 'classnames';
import { motion } from 'framer-motion';

import { fadeAnim } from '@/lib/animate';

export const STATUS_SIGN_IN = 'STATUS_SIGN_IN';
export const STATUS_VERIFICATION = 'STATUS_VERIFICATION';

type AuthContainerType = {
	type: string;
	title: string;
	className?: string;
	children: React.ReactNode;
};

export default function AuthContainer({
	type,
	title,
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
				'relative c-auth max-w-[600px] h-[calc(100vh_-_var(--s-header)_*_2)] mx-auto text-white w-full flex flex-col justify-center',
				className
			)}
		>
			<h1 className="t-h-3 text-center">{title}</h1>
			<div
				className={cx('max-w-96 w-full mx-auto mt-3', {
					'mt-10': type === STATUS_SIGN_IN,
				})}
			>
				{children}
			</div>
		</motion.div>
	);
}
