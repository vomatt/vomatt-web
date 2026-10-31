import type { MetadataRoute } from 'next';

// About and the legal pages moved to the about site
export default function sitemap(): MetadataRoute.Sitemap {
	return ['', '/explore'].map((path) => ({ url: `${process.env.SITE_URL}${path}` }));
}
