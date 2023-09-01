import cx from 'classnames';
import { notFound } from 'next/navigation';
import React from 'react';

import { Metadata, ResolvingMetadata } from 'next';

import { Module } from '@/components/modules';
import getMetaData from '@/lib/getMetaData';
import { getPageBySlug, getPagesPaths } from '@/sanity/lib/fetch';

export const dynamicParams = true;

type GenerateMetadataProps = {
	params: { slug: string };
	searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
	{ params, searchParams }: GenerateMetadataProps,
	parent: ResolvingMetadata
): Promise<Metadata> {
	const slug = params.slug;
	const data = await getPageBySlug(slug);
	return getMetaData({ data });
}

export async function generateStaticParams() {
	const slugs = await getPagesPaths();
	return slugs.map((slug: string) => ({ slug }));
}

type PageSlugRouteProps = {
	params: { slug: string };
};

export default async function PageSlugRoute({ params }: PageSlugRouteProps) {
	const data = await getPageBySlug(params.slug);
	const { page } = data;
	if (!page) {
		return notFound();
	}

	return (
		<div className={cx('page-general', 'c-3')}>
			{page.modules?.map((module: any, key: string) => (
				<Module key={key} index={key} module={module} />
			))}
		</div>
	);
}
