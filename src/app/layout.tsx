import '@/styles/scss/main.scss';

import cx from 'classnames';
import localFont from 'next/font/local';

import Layout from '@/layout';
import { getUserSession } from '@/lib/auth';
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
	const userSession = await getUserSession();

	return (
		<html lang="en">
			<body
				className={cx(fonts.className)}
				style={{ minHeight: userSession ? 'auto' : '100dvh' }}
			>
				<Layout siteData={site} userSession={userSession}>
					{children}
				</Layout>
			</body>
		</html>
	);
}
