import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from 'next';
import * as path from 'path';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')],
	},
	images: {
		remotePatterns: [],
	},
	poweredByHeader: false,
	async headers() {
		return [
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

export default withPayload(nextConfig);
