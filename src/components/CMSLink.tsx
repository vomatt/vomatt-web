import NextLink from 'next/link';
import React from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { aboutHref } from '@/lib/aboutSite';

type CMSLinkType = {
	link?: {
		_type: string;
		linkType?: string;
		href?: string;
		isNewTab: boolean;
	};
	children: React.ReactNode;
	className?: string;
};

const CMSLink: React.FC<CMSLinkType> = ({ link, children, className }) => {
	const { currentLanguage } = useLanguage();
	if (!link?.href) {
		return null;
	}

	// Internal links can only reference the Homepage or a Page, which live on the about site
	const route =
		link.linkType === 'internal'
			? aboutHref(link.href.replace(/^\//, ''), currentLanguage)
			: link.href;

	return (
		<NextLink
			href={route}
			target={route?.match('^mailto:') || link.isNewTab ? '_blank' : ''}
			rel={link.isNewTab ? 'noopener noreferrer' : ''}
			className={className}
		>
			{children}
		</NextLink>
	);
};

export default CMSLink;
