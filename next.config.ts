import type { NextConfig } from 'next';
import * as path from 'path';

import { aboutHref, ABOUT_SITE_SLUGS } from './src/lib/aboutSite';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// ESM-only; listed so next/jest transforms them in tests
	transpilePackages: ['@sanity/image-url', 'groq'],
	experimental: {
		agentUpgrade: 'security',
	},
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')],
	},
	poweredByHeader: false,
	async redirects() {
		// Sign-up and log-in are one form now
		return [
			{ source: '/signup', destination: '/login', permanent: true },
			// Profiles moved to the root, next to Sanity pages
			{ source: '/profile/:username', destination: '/:username', permanent: true },
			// About and the legal pages moved to the about site
			...ABOUT_SITE_SLUGS.map((slug) => ({ source: `/${slug}`, destination: aboutHref(slug, 'en'), permanent: true })),
		];
	},
	async rewrites() {
		// Uploaded avatars are paths on the API origin; the browser asks this host, which forwards them
		const apiUrl = process.env.API_URL?.replace(/\/+$/, '');
		return apiUrl ? [{ source: '/api/avatars/:file', destination: `${apiUrl}/api/avatars/:file` }] : [];
	},
	async headers() {
		return [
			{
				// Not content-hashed, so cached for a day rather than forever
				source: '/avatars/:path*',
				headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
			},
			{
				source: '/:path*',
				headers: [
					{ key: 'X-Frame-Options', value: 'SAMEORIGIN' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
					{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
				],
			},
		];
	},
};

export default nextConfig;
