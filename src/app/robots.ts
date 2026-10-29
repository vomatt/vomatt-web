import type { MetadataRoute } from 'next';

// Disallow is a prefix match: `/account` alone would also hide a profile like /accountant
const PRIVATE_ROOTS = ['account', 'settings', 'notifications', 'my-polls', 'following', 'login'];

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: ['/api/', ...PRIVATE_ROOTS.flatMap((root) => [`/${root}$`, `/${root}/`])],
		},
		sitemap: `${process.env.SITE_URL}/sitemap.xml`,
	};
}
