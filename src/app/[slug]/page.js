import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import { LiveQuery } from 'next-sanity/preview/live-query';

import defineMetadata from '@/lib/defineMetadata';
import { getPageBySlug, getPagesPaths } from '@/sanity/lib/fetch';
import { pagesBySlugQuery } from '@/sanity/lib/queries';

import PageGeneral from '../_components/page-general';

export async function generateStaticParams() {
	const slugs = await getPagesPaths();
	const params = slugs.map((slug) => ({ slug }));
	return params;
}

const getPageData = async ({ params }) => {
	return await getPageBySlug(params);
};

export async function generateMetadata({ params, searchParams }, parent) {
	const data = await getPageData({ params });
	return defineMetadata({ data });
}

export default async function PageSlugRoute({ params }) {
	const data = await getPageData({ params });
	const { page } = data;

	if (!page) {
		return notFound();
	}

	return (
		<LiveQuery
			enabled={draftMode().isEnabled}
			query={pagesBySlugQuery}
			initialData={page}
			params={{ slug: params.slug }}
		>
			<PageGeneral data={page} />
		</LiveQuery>
	);
}
