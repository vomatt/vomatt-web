import React, { ReactNode } from 'react';

import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { MotionProvider } from '@/components/MotionProvider';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar';
import { getMyProfile, getUserSession } from '@/data/auth';
import { UnreadCountProvider } from '@/features/notifications/UnreadCountProvider';

interface LayoutProps {
	children: ReactNode;
}

export async function Layout({ children }: LayoutProps) {
	const [userSession, profile] = await Promise.all([
		getUserSession(),
		getMyProfile(),
	]);

	return (
		<SidebarProvider>
			<UnreadCountProvider signedIn={!!userSession}>
				<AdaSkip />
				<AppSidebar userSession={userSession} profile={profile} />
				<Main>
					<MotionProvider>{children}</MotionProvider>
				</Main>
				<TabBar userSession={userSession} username={profile?.username} />
			</UnreadCountProvider>
		</SidebarProvider>
	);
}
