import type { NextConfig } from 'next';
import * as path from 'path';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')],
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.sanity.io',
				pathname: `/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/**`,
			},
		],
	},
	poweredByHeader: false,
	async redirects() {
		// Sign-up and log-in are one form now
		return [
			{ source: '/signup', destination: '/login', permanent: true },
			// Profiles moved to the root, next to Sanity pages
			{ source: '/profile/:username', destination: '/:username', permanent: true },
		];
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
