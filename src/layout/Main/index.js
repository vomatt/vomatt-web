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
			<div className="c-3">
				<Field
					id="yes"
					name="no"
					value="real"
					label="yes"
					isHideLabel={false}
				/>
			</div>

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
