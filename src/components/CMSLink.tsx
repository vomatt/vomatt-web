import cx from 'classnames';
import NextLink from 'next/link';
import React from 'react';

type CMSLinkType = {
	link?: {
		_type: string;
		route: string;
		isNewTab: boolean;
	};
	title?: string;
	ariaLabel?: string;
	children?: React.ReactNode;
	className?: string;
	isNewTab?: boolean;
	isButton?: boolean;
	tabIndex?: number;
	onClick?: () => void;
};

const CMSLink: React.FC<CMSLinkType> = ({
	link,
	title,
	children,
	className,
	ariaLabel,
	isNewTab,
	isButton,
	...props
}) => {
	if (!link.route) {
		return null;
	}

	const { route } = link;
	const isOpenNewTab = isNewTab ?? link.isNewTab;

	return (
		<NextLink
			href={route}
			target={route?.match('^mailto:') || isOpenNewTab ? '_blank' : null}
			rel={isOpenNewTab ? 'noopener noreferrer' : null}
			aria-label={ariaLabel || `${title || `Go to ${route}`}`}
			className={cx(className, {
				btn: isButton,
			})}
			{...props}
		>
			{title || children}
		</NextLink>
	);
};

export default CMSLink;
