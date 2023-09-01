import '@/styles/scss/main.scss';
import Layout from '@/layout';
import getMetaData from '@/lib/getMetaData';
import { getSiteData } from '@/sanity/lib/fetch';

import StyledJsxRegistry from './registry';

const { site } = await getSiteData();
export const metadata = getMetaData({ data: site });

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<head>
				<meta
					httpEquiv="Content-Type"
					charSet="UTF-8"
					content="text/html;charset=utf-8"
				/>
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
			</head>
			<StyledJsxRegistry>
				<body>
					<Layout siteData={site}>{children}</Layout>
				</body>
			</StyledJsxRegistry>
		</html>
	);
}
