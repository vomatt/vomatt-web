import { Plus } from 'lucide-react';
import React, { ReactNode } from 'react';

import { AdaSkip } from '@/components/layout/AdaSkip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { HeadTrackingCode } from '@/components/layout/HeadTrackingCode';
import { Main } from '@/components/layout/Main';
import { TabBar } from '@/components/layout/TabBar';
import { PollCreator } from '@/components/PollCreator';
import { Button } from '@/components/ui/Button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/Sidebar';
import { getUserSession } from '@/data/auth';

interface LayoutProps {
	siteData: any;
	children: ReactNode;
}

export async function Layout({ children }: LayoutProps) {
	const userSession = await getUserSession();

	return (
		<ClientLayout>
			<SidebarProvider>
				<AdaSkip />
				<AppSidebar userSession={userSession} />
				<Main>{children}</Main>
				<TabBar />
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
		</ClientLayout>
	);
}
