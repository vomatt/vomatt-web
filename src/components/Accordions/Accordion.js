import React, { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'motion/react';

const accordionAnim = {
	open: {
		opacity: 1,
		height: 'auto',
	},
	closed: {
		opacity: 0,
		height: 0,
	},
};

export default function Accordion({ title, children, className }) {
	const [isActive, setActive] = useState(false);

	const toggleActive = () => {
		setActive(!isActive);
	};

	return (
		<div
			className={clsx('c-accordion', className, {
				'is-active': isActive,
			})}
		>
			<button
				type="button"
				aria-expanded={isActive}
				aria-label="Toggle accordion"
				className="c-accordion__toggle f-h f-a-c user-select-disable"
				onClick={toggleActive}
			>
				<div className="c-accordion__title">{title}</div>
				<div className="icon-caret-bottom" />
			</button>

			<motion.div
				className="c-accordion__content"
				aria-hidden={!isActive}
				variants={accordionAnim}
				initial={isActive ? 'open' : 'closed'}
				animate={isActive ? 'open' : 'closed'}
				transition={{ duration: 0.4, ease: [0, 1, 0.8, 1] }}
			>
				<div className="c-accordion__content-interior wysiwyg">{children}</div>
			</motion.div>
		</div>
	);
}
