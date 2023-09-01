'use client';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { siteSetup, VS } from '@/hooks/useVsSetup';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import HeadTrackingCode from '@/layout/HeadTrackingCode';
import * as gtag from '@/lib/gtag';

import AdaSkip from './AdaSkip';
import Announcement from './Announcement';
import Footer from './Footer';
import Header from './Header';
import Main from './Main';
import { SiteDataPayload } from '@/types';

type LayoutProps = {
	children: React.ReactNode;
	siteData: SiteDataPayload;
};

const Layout = ({ children, siteData }: LayoutProps) => {
	const pathname = usePathname();
	// const { height, width } = useWindowDimensions();
	// const { isMobileScreen } = vs();

	useEffect(() => {
		siteSetup();
	}, []);

	useEffect(() => {
		if (siteData?.integrations?.gaID) {
			const url = process.env.SITE_URL;
			gtag.pageview(url, siteData?.integrations?.gaID);
		}
	}, [siteData]);

	if (pathname.startsWith('/sanity')) {
		return children;
	}

	return (
		<>
			<HeadTrackingCode siteData={siteData} />
			<AdaSkip />
			<Announcement data={siteData?.announcement} />
			<Header data={siteData?.header} />
			<Main>{children}</Main>
			<Footer siteData={siteData} data={siteData.footer} />
		</>
	);
};

export default Layout;
