import { Plus } from '@/components/ui/SvgIcons';
import dynamic from 'next/dynamic';
import React, { ReactNode } from 'react';

import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { Button } from '@/components/ui/Button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar';
import { getMyProfile, getUserSession } from '@/data/auth';

const PollCreator = dynamic(() =>
	import('@/components/PollCreator').then((m) => ({
		default: m.PollCreator,
	}))
);

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
			<AdaSkip />
			<AppSidebar userSession={userSession} profile={profile} />
			<Main>{children}</Main>
			<TabBar userSession={userSession} />
			{userSession && (
				<PollCreator
					triggerChildren={
						<Button className="fixed bottom-contain right-contain size-14 flex justify-center items-center bg-secondary rounded-xl cursor-pointer hover:scale-120 transition-all hover:bg-secondary/90">
							<Plus className="size-5 text-white" />
						</Button>
					}
				/>
			)}
		</SidebarProvider>
	);
}
