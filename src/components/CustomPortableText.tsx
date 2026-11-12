'use client';

import {
	PortableText,
	type PortableTextBlock,
	type PortableTextComponents as PortableTextComponentsType,
} from '@portabletext/react';
import React from 'react';

import CMSLink from '@/components/CMSLink';

const PortableTextComponents: PortableTextComponentsType = {
	marks: {
		link: ({ value, children }) => {
			return (
				<CMSLink link={value} className="underline underline-offset-2">
					{children}
				</CMSLink>
			);
		},
	},
};

type CustomPortableTextProps = {
	blocks?: PortableTextBlock[] | null;
};

export default function CustomPortableText({
	blocks,
}: CustomPortableTextProps) {
	if (!blocks) return null;

	return <PortableText value={blocks} components={PortableTextComponents} />;
}
