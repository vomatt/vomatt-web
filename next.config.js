const path = require('path');

const nextConfig = {
	reactStrictMode: true,
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')],
	},
	images: {
		dangerouslyAllowSVG: true,
		domains: ['cdn.sanity.io'],
	},
};

module.exports = nextConfig;
