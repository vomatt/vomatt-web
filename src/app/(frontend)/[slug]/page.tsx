import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';

import config from '@payload-config';
import { getServerLocale } from '@/lib/getServerLocale';

import PageGeneral from '../_components/PageGeneral';

export async function generateStaticParams() {
	const payload = await getPayload({ config });
	const pages = await payload.find({
		collection: 'pages',
		where: { _status: { equals: 'published' } },
		select: { slug: true },
		limit: 1000,
	});

	return pages.docs
		.filter((page) => page.slug)
		.map((page) => ({ slug: page.slug }));
}

type Props = {
	params: Promise<{ slug: string }>;
};

async function getPageBySlug(slug: string, payloadLocale: string) {
	const payload = await getPayload({ config });
	const result = await payload.find({
		collection: 'pages',
		where: { slug: { equals: slug } },
		locale: payloadLocale as 'en' | 'zh-TW',
		limit: 1,
	});
	return result.docs[0] ?? null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
	const params = await props.params;
	const { payloadLocale } = await getServerLocale();
	const page = await getPageBySlug(params.slug, payloadLocale);
	if (!page) return {};

	const meta = page.meta as { metaTitle?: string | null; metaDescription?: string | null } | null | undefined;

	return {
		title: meta?.metaTitle ?? page.title ?? '',
		description: meta?.metaDescription ?? '',
	};
}

export default async function PageSlugRoute(props: Props) {
	const params = await props.params;
	const { payloadLocale } = await getServerLocale();
	const page = await getPageBySlug(params.slug, payloadLocale);
	if (!page) return notFound();

	return <PageGeneral data={page} />;
}
