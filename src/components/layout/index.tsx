import React, { ReactNode } from 'react';

import { MarkLoader } from '@/components/BrandPulse';
import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { MotionProvider } from '@/components/MotionProvider';
import { ReloadWhenSessionUnconfirmed, SessionRetry } from '@/components/SessionRetry';
import { SidebarProvider } from '@/components/ui/Sidebar';
import { getLoginHref, getUserSession, loadActingState, loadMyProfile } from '@/data/auth';
import { ActingBanner } from '@/features/communities/ActingBanner';
import { ActingProvider } from '@/features/communities/ActingProvider';
import { KeepCommunitiesPrompt } from '@/features/communities/KeepCommunitiesPrompt';
import { PendingFollow } from '@/features/follows/FollowButton';
import { UnreadCountProvider } from '@/features/notifications/UnreadCountProvider';

interface LayoutProps {
	children: ReactNode;
}

export async function Layout({ children }: LayoutProps) {
	const [session, { profile, error }, loginLink, acting] = await Promise.all([
		getUserSession(),
		loadMyProfile(),
		getLoginHref(),
		loadActingState(),
	]);
	// The API didn't answer, so whether they're signed in is unknown: wait for it rather than show them signed out
	if (error) {
		console.error('Could not load the signed-in profile', error);
		return <SessionRetry loader={<MarkLoader />} />;
	}
	// The cookie names an account the user can no longer act as, but requests still carry it: show nothing
	// until the provider has ended acting and the page reloads as the user
	if (acting.stale) {
		return (
			<ActingProvider state={acting}>
				<div className="grid min-h-svh place-items-center">
					<MarkLoader />
				</div>
			</ActingProvider>
		);
	}

	return (
		<SidebarProvider>
			{/* Keyed on the account: a switch remounts every client component, so none keeps the last account's state */}
			<ActingProvider key={acting.acting?.communityId ?? 'self'} state={acting}>
				<UnreadCountProvider signedIn={!!session}>
					{/* Wraps the nav too: the poll creator opens from the sidebar and TabBar */}
					<MotionProvider>
						<ReloadWhenSessionUnconfirmed />
						<PendingFollow />
						{/* Acting, the profile is the community account's; the person is asked once they're back */}
						{!acting.acting && profile?.communityQuota?.selectionRequired && <KeepCommunitiesPrompt quota={profile.communityQuota} />}
						<AdaSkip />
						<AppSidebar userSession={session} profile={profile} loginLink={loginLink} />
						<Header signedIn={!!session} loginLink={loginLink} username={profile?.username} avatarUrl={profile?.avatarUrl} />
						<Main>
							<ActingBanner />
							{children}
						</Main>
						<TabBar userSession={session} loginLink={loginLink} />
					</MotionProvider>
				</UnreadCountProvider>
			</ActingProvider>
		</SidebarProvider>
	);
}
