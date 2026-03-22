import { motion } from 'motion/react';
import Link from 'next/link';

import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';
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
		<div className="relative max-w-xs mx-auto w-full h-full flex flex-col justify-center">
			<div className="fixed top-0 py-6 bg-background/90 w-full left-1/2 -translate-x-1/2 backdrop-blur-sm">
				<Link href="/" className="w-36 mx-auto block">
					<BrandLogo />
				</Link>
			</div>
			<motion.div
				key={type}
				initial="hide"
				animate="show"
				exit="hide"
				variants={fadeAnim}
				// className={cn('pt-header-space-10 pb-10', className)}
				className={cn('pt-[calc(var(--header-height)+20px)] pb-10', className)}
			>
				{children}
			</motion.div>
		</div>
	);
}
