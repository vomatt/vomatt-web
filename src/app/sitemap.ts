import type { MetadataRoute } from 'next';

import { getPageSlugs } from '@/sanity/lib/pageSlugs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const paths = ['', '/explore', ...(await getPageSlugs()).map((slug) => `/${slug}`)];
	return paths.map((path) => ({ url: `${process.env.SITE_URL}${path}` }));
}
