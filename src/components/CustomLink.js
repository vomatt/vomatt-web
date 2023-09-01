import cx from 'classnames';
import NextLink from 'next/link';
import React from 'react';

import { getLinkRouteObject } from '@/lib/routes';

const CustomLink = ({
	link,
	title,
	children,
	className,
	ariaLabel,
	isNewTab,
	isButton,
	...rest
}) => {
	if (!link.route) {
		return null;
	}

	const { route } = getLinkRouteObject(link);
	const { url } = route;

	return (
		<NextLink
			href={url}
			scroll={false}
			target={url?.match('^mailto:') || isNewTab ? '_blank' : null}
			rel={isNewTab ? 'noopener noreferrer' : null}
			aria-label={ariaLabel || `Go to ${url}`}
			className={cx(className, {
				btn: isButton,
			})}
			{...rest}
		>
			{title || children}
		</NextLink>
	);
};

export default CustomLink;
