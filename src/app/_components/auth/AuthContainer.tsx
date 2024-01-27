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
			className={cx('c-auth f-v f-j-c', className)}
		>
			<h1 className="c-auth__heading t-h-2">{title}</h1>
			<div className="c-auth__content f-v f-j-c">{children}</div>
		</motion.div>
	);
};

export default AuthContainer;
