import React, { ReactNode } from 'react';

import { MarkLoader } from '@/components/BrandPulse';
import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { MotionProvider } from '@/components/MotionProvider';
import { ReloadWhenSessionUnconfirmed, SessionRetry } from '@/components/SessionRetry';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar';
import { getLoginHref, getUserSession, loadMyProfile } from '@/data/auth';
import { UnreadCountProvider } from '@/features/notifications/UnreadCountProvider';

interface LayoutProps {
	children: ReactNode;
}

export async function Layout({ children }: LayoutProps) {
	const [session, { profile, error }, loginLink] = await Promise.all([
		getUserSession(),
		loadMyProfile(),
		getLoginHref(),
	]);
	// The API didn't answer, so whether they're signed in is unknown: wait for it rather than show them signed out
	if (error) {
		console.error('Could not load the signed-in profile', error);
		return <SessionRetry loader={<MarkLoader />} />;
	}

	return (
		<SidebarProvider>
			<UnreadCountProvider signedIn={!!session}>
				{/* Wraps the nav too: the poll creator opens from the sidebar and TabBar */}
				<MotionProvider>
					<ReloadWhenSessionUnconfirmed />
					<AdaSkip />
					<AppSidebar userSession={session} profile={profile} loginLink={loginLink} />
					<Header signedIn={!!session} loginLink={loginLink} username={profile?.username} avatarUrl={profile?.avatarUrl} />
					<Main>{children}</Main>
					<TabBar userSession={session} loginLink={loginLink} />
				</MotionProvider>
			</UnreadCountProvider>
		</SidebarProvider>
	);
}
