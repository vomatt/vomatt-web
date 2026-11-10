import NextLink from 'next/link';
import React from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { aboutHref } from '@/lib/aboutSite';
import { cn } from '@/lib/utils';

type CMSLinkType = {
	link?: {
		_type: string;
		linkType?: string;
		href?: string;
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
	const { currentLanguage } = useLanguage();
	if (!link?.href) {
		return null;
	}

	// Internal links can only reference the Homepage or a Page, which live on the about site
	const route =
		link.linkType === 'internal'
			? aboutHref(link.href.replace(/^\//, ''), currentLanguage)
			: link.href;
	const isOpenNewTab = isNewTab ?? link.isNewTab;

	return (
		<NextLink
			href={route}
			target={route?.match('^mailto:') || isOpenNewTab ? '_blank' : ''}
			rel={isOpenNewTab ? 'noopener noreferrer' : ''}
			// The visible text names the link (WCAG 2.5.3); the destination only names one with nothing to read
			aria-label={
				ariaLabel || (title || children ? undefined : `Go to ${route}`)
			}
			className={cn(className, {
				btn: isButton,
			})}
			{...props}
		>
			{title || children}
		</NextLink>
	);
};

export default CMSLink;
