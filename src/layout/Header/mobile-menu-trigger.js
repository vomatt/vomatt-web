import clsx from 'clsx';
import React from 'react';

export default function MobileMenuTrigger({ isMobileMenuOpen, onHandleClick }) {
	return (
		<button
			aria-label="Toggle Menu"
			className={clsx('g-mobile-menu-trigger mobile-down-only', {
				'is-open': isMobileMenuOpen,
			})}
			onClick={onHandleClick}
		>
			<div className="line" />
			<div className="line" />
			<div className="line" />
		</button>
	);
}
