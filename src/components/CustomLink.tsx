import cx from 'classnames';
import NextLink from 'next/link';
import React from 'react';
import { LinkPayload } from '@/types';
import { getLinkRouteObject } from '@/lib/routes';

type CustomLinkProps = {
	tabIndex?: number | null;
	link: LinkPayload;
	title: string;
	children?: React.ReactNode;
	className?: string;
	ariaLabel?: string;
	isNewTab?: boolean | undefined;
	isButton?: boolean | undefined;
	onClick?: () => void | undefined;
};

const CustomLink = ({
	link,
	title,
	children,
	className,
	ariaLabel,
	isNewTab,
	isButton,
	onClick,
}: CustomLinkProps) => {
	if (!link.route) {
		return null;
	}

	const { route } = getLinkRouteObject(link);
	const { url } = route;
	const isOpenNewTabe = isNewTab ?? link.isNewTab;

	return (
		<NextLink
			href={url}
			scroll={false}
			target={url?.match('^mailto:') || isOpenNewTabe ? '_blank' : undefined}
			rel={isOpenNewTabe ? 'noopener noreferrer' : undefined}
			aria-label={ariaLabel || `Go to ${url}`}
			className={cx(className, {
				btn: isButton,
			})}
			onClick={onClick}
		>
			{title || children}
		</NextLink>
	);
};

export default CustomLink;
