import cx from 'classnames';
import { motion } from 'framer-motion';

import { fadeAnim } from '@/lib/animate';

type AuthContainerType = {
	type: string;
	title: string;
	className?: string;
	children: React.ReactNode;
};

const AuthContainer: React.FC<AuthContainerType> = ({
	type,
	title,
	className,
	children,
}) => {
	return (
		<motion.div
			key={type}
			initial="hide"
			animate="show"
			exit="hide"
			variants={fadeAnim}
			className={cx(
				'c-auth max-w-[600px] h-[calc(100vh_-_var(--s-header)_*_2)] mx-auto text-white w-full flex flex-col justify-center',
				className
			)}
		>
			<h1 className="mb-10 uppercase t-h-2 text-center">{title}</h1>
			<div className="max-w-96 w-full mx-auto">{children}</div>
		</motion.div>
	);
};

export default AuthContainer;
