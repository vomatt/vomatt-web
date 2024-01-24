'use client';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { siteSetup } from '@/hooks/useSetup';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import HeadTrackingCode from '@/layout/HeadTrackingCode';
import * as gtag from '@/lib/gtag';

import Announcement from './Announcement';
import Footer from './Footer';
import Header from './Header';
import Main from './Main';

const Layout = ({ children, siteData }) => {
	const { header, footer } = siteData;
	const pathname = usePathname();
	// const { height, width } = useWindowDimensions();
	// const { isMobileScreen } = vs();

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
			{/* <Announcement data={siteData?.announcement} /> */}
			<Header data={header} />
			<Main siteData={siteData}>{children}</Main>
			<Footer siteData={siteData} data={footer} />
		</>
	);
};

export default Layout;
