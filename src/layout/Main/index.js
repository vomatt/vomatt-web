import {
	AnimatePresence,
	domAnimation,
	LazyMotion,
	motion,
} from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

import Field from '@/components/Field';
import { pageTransitionFade } from '@/lib/animate';

export default function Main({ children }) {
	const pathName = usePathname();
	return (
		<>
			<LazyMotion features={domAnimation}>
				<AnimatePresence mode="wait">
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
				</AnimatePresence>
			</LazyMotion>
		</>
	);
}
