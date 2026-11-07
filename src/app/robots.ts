import type { MetadataRoute } from 'next';

import { SIGNED_IN_FEED_ROOTS } from '@/features/polls/feeds';

// Disallow is a prefix match: `/account` alone would also hide a profile like /accountant
const PRIVATE_ROOTS = ['account', 'settings', 'notifications', ...SIGNED_IN_FEED_ROOTS, 'login'];

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
