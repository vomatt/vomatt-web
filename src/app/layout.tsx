import '@/styles/scss/main.scss';

import localFont from 'next/font/local';

import Layout from '@/layout';
import defineMetadata from '@/lib/defineMetadata';
import { getSiteData } from '@/sanity/lib/fetch';

export async function generateMetadata({}) {
	const { site } = await getSiteData();
	return defineMetadata({ data: site });
}

const fonts = localFont({
	src: [
		{
			path: '../public/fonts/gerstner-programm-regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../public/fonts/abc-diatype-mono-regular.woff2',
			weight: '400',
			style: 'normal',
		},
	],
});

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { site } = await getSiteData();
	return (
		<html lang="en">
			<body className={fonts.className}>
				<Layout siteData={site}>{children}</Layout>
			</body>
		</html>
	);
}
