import cx from 'classnames';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

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

const Accordion = ({ title, children, className }) => {
	const [isActive, setActive] = useState(false);
	const toggleActive = () => {
		setActive(!isActive);
	};

	return (
		<>
			<div
				className={cx('comp-accordion', className, {
					'is-active': isActive,
				})}
			>
				<button
					type="button"
					onClick={toggleActive}
					aria-expanded={isActive}
					aria-label="Toggle accordion"
					className="accordion-toggle f-h f-a-c"
				>
					<div className="accordion-title">{title}</div>
					<div className="icon-caret-bottom" />
				</button>
				<motion.div
					className="accordion-content"
					aria-hidden={!isActive}
					variants={accordionAnim}
					initial={isActive ? 'open' : 'closed'}
					animate={isActive ? 'open' : 'closed'}
					transition={{ duration: 0.4, ease: [0, 1, 0.8, 1] }}
				>
					<div className="accordion-interior">{children}</div>
				</motion.div>
			</div>

			<style jsx>{`
				.comp-accordion {
					position: relative;
				}

				.accordion-toggle {
					gap: 5px;

					.icon-caret-bottom {
						transition: transform 0.15s;
					}
				}

				:global(.accordion-content) {
					overflow: hidden;
				}

				.comp-accordion.is-active {
					.accordion-toggle .icon-caret-bottom {
						transform: rotate(-180deg);
					}
				}
			`}</style>
		</>
	);
};

export default Accordion;
