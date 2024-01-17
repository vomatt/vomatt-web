import '@/styles/scss/main.scss';

// import localFont from 'next/font/local';
import Layout from '@/layout';
import defineMetadata from '@/lib/defineMetadata';
import { getSiteData } from '@/sanity/lib/fetch';

export async function generateMetadata({}) {
	const { site } = await getSiteData();
	return defineMetadata({ data: site });
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
