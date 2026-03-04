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
};

export default withPayload(nextConfig);
