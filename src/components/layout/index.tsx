import React, { ReactNode } from 'react';

import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { MotionProvider } from '@/components/MotionProvider';
import { ReloadWhenSessionUnconfirmed } from '@/components/SessionRetry';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar';
import { getLoginHref, getMyProfile, getUserSession } from '@/data/auth';
import { UnreadCountProvider } from '@/features/notifications/UnreadCountProvider';

interface LayoutProps {
	children: ReactNode;
}

export async function Layout({ children }: LayoutProps) {
	const [userSession, profile, loginLink] = await Promise.all([
		getUserSession(),
		getMyProfile(),
		getLoginHref(),
	]);
	// A token whose account the API refused has no profile: show the signed-out nav
	const session = profile ? userSession : null;

	return (
		<SidebarProvider>
			<UnreadCountProvider signedIn={!!session}>
				{/* Wraps the nav too: the poll creator opens from the sidebar and TabBar */}
				<MotionProvider>
					<ReloadWhenSessionUnconfirmed />
					<AdaSkip />
					<AppSidebar userSession={session} profile={profile} loginLink={loginLink} />
					<Header />
					<Main>{children}</Main>
					<TabBar userSession={session} loginLink={loginLink} username={profile?.username} avatarUrl={profile?.avatarUrl} />
				</MotionProvider>
			</UnreadCountProvider>
		</SidebarProvider>
	);
}
