import React, { ReactNode } from 'react';

import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { MotionProvider } from '@/components/MotionProvider';
import { ReloadWhenSessionUnconfirmed } from '@/components/SessionRetry';
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
				{/* Wraps the nav too: the poll creator opens from the sidebar and TabBar */}
				<MotionProvider>
					<ReloadWhenSessionUnconfirmed />
					<AdaSkip />
					<AppSidebar userSession={userSession} profile={profile} />
					<Header />
					<Main>{children}</Main>
					<TabBar userSession={userSession} username={profile?.username} avatarUrl={profile?.avatarUrl} />
				</MotionProvider>
			</UnreadCountProvider>
		</SidebarProvider>
	);
}
