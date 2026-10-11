// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-fields
import type { Metadata } from 'next';

import { formatUrl, resolveHref } from '@/lib/utils';
import { buildShareImageUrl } from '@/sanity/lib/image';

type Props = {
	data: {
		sharing?: any;
		title?: string;
		isHomepage?: boolean;
		_type?: string;
		slug?: string;
	};
};

export default function defineMetadata({ data }: Props): Metadata {
	const { sharing, title, isHomepage, _type, slug } = data || {};

	const siteTitle = sharing?.siteTitle || '';
	const metaDesc = sharing?.metaDesc || '';
	const metaTitle = sharing?.metaTitle || title || `Page not found`;
	const shareGraphic = sharing?.shareGraphic?.asset;
	const shareGraphicUrl = shareGraphic ? buildShareImageUrl(shareGraphic) : '';

	const disableIndex = sharing?.disableIndex;
	const pageRoute = resolveHref({
		documentType: _type,
		slug: slug,
	});

	return {
		...(isHomepage ? null : { title: metaTitle }),
		description: metaDesc,
		openGraph: {
			title: metaTitle,
			description: metaDesc,
			images: shareGraphicUrl
				? [{ url: shareGraphicUrl, width: 1200, height: 630 }]
				: [],
		},

		alternates: {
			...(pageRoute && {
				canonical: formatUrl(`${process.env.SITE_URL}${pageRoute}`),
			}),
		},
		robots: {
			index: !disableIndex,
			follow: !disableIndex,
			nocache: true,
		},
	};
}
