'use client';
import { usePathname } from 'next/navigation';
import React, { ReactNode, useEffect } from 'react';

import { siteSetup } from '@/hooks/useSetup';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import HeadTrackingCode from '@/layout/HeadTrackingCode';
import * as gtag from '@/lib/gtag';

import AdaSkip from './AdaSkip';
import Announcement from './Announcement';
import Footer from './Footer';
import Header from './Header';
import Main from './Main';

type MainProps = {
	siteData: any;
	children: ReactNode;
	userSession: any;
};

export default function Layout({ children, siteData, userSession }: MainProps) {
	const { header, footer } = siteData;
	const pathname = usePathname();

	useEffect(() => {
		siteSetup();
	}, []);

	// useEffect(() => {
	// 	if (siteData?.integrations?.gaID) {
	// 		gtag.pageview(url, siteData?.integrations?.gaID);
	// 	}
	// }, [siteData]);

	if (pathname.startsWith('/sanity')) {
		return children;
	}

	return (
		<>
			<HeadTrackingCode siteData={siteData} />
			<AdaSkip />
			{/* <Announcement data={siteData?.announcement} /> */}
			<Header data={header} userSession={userSession} />
			<Main siteData={siteData}>{children}</Main>
			<Footer siteData={siteData} data={footer} />
		</>
	);
}
