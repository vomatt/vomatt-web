import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import defineMetadata from '@/lib/defineMetadata';
import { sanityFetch } from '@/sanity/lib/live';
import { pageGeneralQuery, pageGeneralSlugsQuery } from '@/sanity/lib/queries';

import PageGeneral from '../_components/PageGeneral';

export async function generateStaticParams() {
	const { data } = await sanityFetch({
		query: pageGeneralSlugsQuery,
	});

	return data;
}

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
	const params = await props.params;
	const { data } = await sanityFetch({
		query: pageGeneralQuery,
		params,
	});
	return defineMetadata({ data });
}

export default async function PageSlugRoute(props: Props) {
	const params = await props.params;

	const { data } = await sanityFetch({
		query: pageGeneralQuery,
		params,
	});

	if (!data) {
		return notFound();
	}

	return <PageGeneral data={data} />;
}
