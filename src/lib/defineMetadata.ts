// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-fields
import { Metadata } from 'next';

import { imageBuilder } from '@/sanity/lib/image';

export default function defineMetadata({ data }): Metadata {
	const { site, page } = data || {};
	const siteTitle = site?.title || '';
	const metaDesc = page?.sharing?.metaDesc || site?.sharing?.metaDesc;
	const metaTitle =
		page?.isHomepage == true
			? page?.sharing?.metaTitle || siteTitle
			: `${
					page?.sharing?.metaTitle || page?.title || 'Page not found'
			  } | ${siteTitle}`;

	const siteFavicon = site?.sharing?.favicon || false;
	const siteFaviconUrl = siteFavicon
		? imageBuilder.image(siteFavicon).width(256).height(256).url()
		: '/favicon.ico';

	const shareGraphic =
		page?.sharing?.shareGraphic?.asset ||
		site?.sharing?.shareGraphic?.asset ||
		'';
	const shareGraphicUrl = shareGraphic
		? imageBuilder.image(shareGraphic).url()
		: '';

	const disableIndex = page?.sharing?.disableIndex;

	return {
		title: metaTitle,
		description: metaDesc,
		creator: siteTitle,
		publisher: siteTitle,
		applicationName: siteTitle,
		openGraph: {
			title: metaTitle,
			description: metaDesc,
			images: [shareGraphicUrl],
			url: process.env.SITE_URL,
			siteName: siteTitle,
			locale: 'en_US',
			type: 'website',
		},
		icons: {
			icon: siteFaviconUrl,
		},
		twitter: {
			card: 'summary_large_image',
			title: metaTitle,
			description: metaDesc,
			creator: siteTitle,
			images: [shareGraphicUrl],
		},
		metadataBase: new URL(process.env.SITE_URL),
		alternates: {
			canonical: '/',
			languages: {
				'en-US': '/en-US',
			},
		},
		...(disableIndex && {
			robots: {
				index: false,
				follow: false,
				nocache: true,
			},
		}),
	};
}
