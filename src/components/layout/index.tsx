import React, { ReactNode } from 'react';

import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { HeadTrackingCode } from '@/components/layout/HeadTrackingCode';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';

interface LayoutProps {
	siteData: any;
	children: ReactNode;
	userSession: any;
}

export function Layout({ siteData, userSession, children }: LayoutProps) {
	const { header, footer } = siteData;

	return (
		<>
			<HeadTrackingCode siteData={siteData} />
			<AdaSkip />
			<Header data={header} userSession={userSession} />
			<Main>{children}</Main>
			<TabBar />
		</>
	);
}
