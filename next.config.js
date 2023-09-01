const path = require('path');

const nextConfig = {
	swcMinify: true,
	sassOptions: {
		includePaths: [path.join(__dirname, 'styles')],
	},
	images: {
		dangerouslyAllowSVG: true,
		domains: ['cdn.sanity.io'],
	},
	i18n: {
		locales: ['en'],
		defaultLocale: 'en',
	},
};

module.exports = nextConfig;
