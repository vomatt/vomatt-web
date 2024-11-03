import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React, { ReactNode } from 'react';

import { pageTransitionFade } from '@/lib/animate';

type MainProps = {
	siteData: any;
	children: ReactNode;
};

export default function Main({ children }: MainProps) {
	const pathName = usePathname();
	return (
		<motion.main
			id="main"
			key={pathName}
			initial="initial"
			animate="animate"
			exit="exit"
			variants={pageTransitionFade}
		>
			{children}
		</motion.main>
	);
}
