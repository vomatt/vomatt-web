import cx from 'classnames';
import NextLink from 'next/link';
import React from 'react';

import { getLinkRouteObject } from '@/lib/routes';

type CMSLinkType = {
	link?: any;
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

	const { route } = getLinkRouteObject(link);
	const { url } = route;
	const isOpenNewTab = isNewTab ?? link.isNewTab;

	return (
		<NextLink
			href={url}
			target={url?.match('^mailto:') || isOpenNewTab ? '_blank' : null}
			rel={isOpenNewTab ? 'noopener noreferrer' : null}
			aria-label={ariaLabel || `${title || `Go to ${url}`}`}
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
