'use client';
import { usePathname } from 'next/navigation';
import React, { ReactNode } from 'react';

import HeadTrackingCode from './HeadTrackingCode';
import * as gtag from '@/lib/gtag';

import AdaSkip from './AdaSkip';
import Footer from './Footer';
import Header from './Header';
import Main from './Main';

interface LayoutProps {
	siteData: any;
	children: ReactNode;
	userSession: any;
}

export function Layout({ siteData, userSession, children }: LayoutProps) {
	const { header, footer } = siteData;
	const pathname = usePathname();

	// useEffect(() => {
	// 	if (siteData?.integrations?.gaID) {
	// 		gtag.pageview(url, siteData?.integrations?.gaID);
	// 	}
	// }, [siteData]);

	return (
		<>
			<HeadTrackingCode siteData={siteData} />
			<AdaSkip />
			<Header data={header} userSession={userSession} />
			<Main>{children}</Main>
			<Footer siteData={siteData} data={footer} />
		</>
	);
}
