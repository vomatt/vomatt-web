import '@/styles/scss/main.scss';
import React, { ReactNode } from 'react';
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

const fontsGerstnerProgramm = localFont({
	src: [
		{
			path: '../fonts/gerstner-programm-regular.woff2',
			weight: '400',
			style: 'normal',
		},
		{
			path: '../fonts/abc-diatype-mono-regular.woff2',
			weight: '400',
			style: 'normal',
		},
	],
	variable: '--font-gerstner-programm',
});

const fontsAbcDiatypeMono = localFont({
	src: [
		{
			path: '../fonts/abc-diatype-mono-regular.woff2',
			weight: '400',
			style: 'normal',
		},
	],
	variable: '--font-abc-diatype-mono',
});

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	const { site } = await getSiteData();
	const userSession = await getUserSession();

	return (
		<html lang="en" className="bg-black">
			<body
				className={cx(
					fontsGerstnerProgramm.variable,
					fontsAbcDiatypeMono.variable
				)}
				style={{ minHeight: userSession ? 'auto' : '100dvh' }}
			>
				<Layout siteData={site} userSession={userSession}>
					{children}
				</Layout>
			</body>
		</html>
	);
}
