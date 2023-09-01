import { imageBuilder } from '@/sanity/lib/image';
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-fields
import { MainDataPayload } from '@/types';

const getMetaData = ({ data }: MainDataPayload) => {
	const { site, page } = data || {};
	const siteTitle = site?.title || '';
	const metaDesc = page?.sharing?.metaDesc || site?.sharing?.metaDesc;
	const metaTitle =
		page?.isHomepage == true
			? siteTitle
			: `${
					page?.sharing?.metaTitle || page?.title || 'Page not found'
			  } | ${siteTitle}`;

	const siteFavicon = site?.sharing?.favicon || false;
	const siteFaviconUrl = siteFavicon
		? imageBuilder.image(siteFavicon).width(256).height(256).url()
		: '/icon.png';

	const shareGraphic =
		page?.sharing?.shareGraphic?.asset ||
		site?.sharing?.shareGraphic?.asset ||
		'';
	const shareGraphicUrl = shareGraphic
		? imageBuilder.image(shareGraphic).width(1200).height(630).url()
		: false;

	const disableIndex = page?.sharing?.disableIndex;

	return {
		title: metaTitle,
		description: metaDesc,
		creator: 'View Source',
		publisher: 'View Source',
		applicationName: 'View Source Template',
		keywords: ['Next.js', 'View Source', 'JavaScript'],
		openGraph: {
			title: metaTitle,
			description: metaDesc,
			images: [shareGraphicUrl],
			url: process.env.SITE_URL,
			siteName: siteTitle,
			locale: 'en_US',
			type: 'website',
		},
		viewport: {
			width: 'device-width',
			initialScale: 1.0,
			maximumScale: 5.0,
			userScalable: 'yes',
		},
		icons: {
			icon: siteFaviconUrl,
			shortcut: '/shortcut-icon.png',
			apple: '/apple-icon.png',
			other: {
				rel: 'apple-touch-icon-precomposed',
				url: '/apple-touch-icon-precomposed.png',
			},
		},
		themeColor: [
			{ media: '(prefers-color-scheme: light)', color: 'white' },
			{ media: '(prefers-color-scheme: dark)', color: 'black' },
		],
		twitter: {
			card: 'summary_large_image',
			title: metaTitle,
			description: metaDesc,
			creator: 'View Source',
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
};

export default getMetaData;
