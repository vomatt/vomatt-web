// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-fields
import type { Metadata } from 'next';

import { formatUrl } from '@/lib/utils';

type MetaGroup = {
	metaTitle?: string | null;
	metaDescription?: string | null;
	shareImage?: { url?: string | null; filename?: string | null } | null;
};

type Props = {
	data: {
		meta?: MetaGroup | null;
		title?: string | null;
		slug?: string | null;
	};
};

function buildMediaUrl(doc: { url?: string | null; filename?: string | null } | null | undefined): string | null {
	if (!doc) return null;
	if (doc.url) return doc.url;
	if (doc.filename) return `${process.env.SITE_URL ?? ''}/api/media/file/${doc.filename}`;
	return null;
}

export default function defineMetadata({ data }: Props): Metadata {
	const { meta, title, slug } = data || {};

	const metaTitle = meta?.metaTitle ?? title ?? 'Page not found';
	const metaDesc = meta?.metaDescription ?? '';
	const shareGraphicUrl = buildMediaUrl(meta?.shareImage) ?? '';

	const pageRoute = slug ? `/${slug}` : null;

	return {
		title: metaTitle,
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
	};
}
