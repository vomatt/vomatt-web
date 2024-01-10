import Layout from '@/layout';
import getMetaData from '@/lib/getMetaData';
import { getSiteData } from '@/sanity/lib/fetch';
import '@/styles/scss/main.scss';
import localFont from 'next/font/local';

export async function generateMetadata({}) {
	const { site } = await getSiteData();
	return getMetaData({ data: site });
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { site } = await getSiteData();
	return (
		<html lang="en">
			<body>
				<Layout siteData={site}>{children}</Layout>
			</body>
		</html>
	);
}
