import cx from 'classnames';
import { notFound } from 'next/navigation';
import React from 'react';

import { Module } from '@/components/modules';
import defineMetadata from '@/lib/defineMetadata';
import { getPageBySlug, getPagesPaths } from '@/sanity/lib/fetch';

export const dynamicParams = true;

export async function generateMetadata({ params, searchParams }, parent) {
	const data = await getPageBySlug(params.slug);
	return defineMetadata({ data });
}

export async function generateStaticParams() {
	const slugs = await getPagesPaths();
	return slugs.map((slug) => ({ slug }));
}

export default async function PageSlugRoute({ params }) {
	const data = await getPageBySlug(params.slug);
	const { page } = data;
	if (!page) {
		return notFound();
	}

	return (
		<div className={cx('page-general', 'c-3')}>
			{page.modules?.map((module, key) => (
				<Module key={key} index={key} module={module} />
			))}
		</div>
	);
}
