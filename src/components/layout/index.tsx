import React, { ReactNode } from 'react';

import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Header } from '@/components/layout/Header';
import { HeadTrackingCode } from '@/components/layout/HeadTrackingCode';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { PollCreator } from '@/components/PollCreator';

interface LayoutProps {
	siteData: any;
	children: ReactNode;
	userSession: any;
}

export function Layout({ siteData, userSession, children }: LayoutProps) {
	const { header, footer } = siteData;

	return (
		<ClientLayout>
			<HeadTrackingCode siteData={siteData} />
			<AdaSkip />
			<Header data={header} userSession={userSession} />
			<Main>{children}</Main>
			<TabBar />
			<PollCreator triggerClassName="fixed bottom-contain right-contain size-14 flex justify-center items-center bg-secondary rounded-xl cursor-pointer hover:scale-120 transition-all hover:bg-secondary/90" />
		</ClientLayout>
	);
}
