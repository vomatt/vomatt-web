import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { T } from '@/components/T';
import { Lock } from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
import { getMyProfile } from '@/data/auth';
import {
	NotificationList,
	NotificationSettingsLink,
	NotificationsHeader,
} from '@/features/notifications/NotificationList';
import { getNotificationPreferences, getNotifications } from '@/features/notifications/service';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
	const profile = await getMyProfile();
	if (!profile) redirect('/login?redirect=/notifications');

	return (
		<div className="px-contain mx-auto flex max-w-[1000px] flex-col gap-10 pt-8 pb-16 xl:flex-row xl:items-start">
			<Suspense
				fallback={
					<Column>
						<NotificationsHeader />
						<PollRowListSkeleton chip={false} />
					</Column>
				}
			>
				<Notifications viewerUsername={profile.username} />
			</Suspense>
		</div>
	);
}

function Column({ children }: { children: React.ReactNode }) {
	return <div className="flex min-w-0 flex-1 flex-col gap-5 xl:max-w-[680px]">{children}</div>;
}

async function Notifications({ viewerUsername }: { viewerUsername: string }) {
	const [firstPage, preferences] = await Promise.all([
		getNotifications().catch(() => null),
		getNotificationPreferences().catch(() => null),
	]);
	const empty = firstPage?.items.length === 0;
	return (
		<>
			<Column>
				<NotificationList initialPage={firstPage} viewerUsername={viewerUsername} />
			</Column>
			{/* How rows are read means nothing until there is a row */}
			{!empty && (
				<aside className="flex w-full flex-col gap-3 xl:sticky xl:top-8 xl:w-[280px] xl:shrink-0">
					<TidePanel className="p-3.5 text-[13px] leading-relaxed">
						<p className="mb-1 flex items-center gap-1.5 font-medium">
							<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
							<T k="notifications.railTitle" />
						</p>
						<p>
							<T k="notifications.railBody" />
						</p>
					</TidePanel>
					<NotificationSettingsLink preferences={preferences} />
				</aside>
			)}
		</>
	);
}
