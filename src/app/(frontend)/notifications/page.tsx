import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { T } from '@/components/T';
import { Lock } from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
import { getUserSession } from '@/data/auth';
import { NotificationList, NotificationsHeader } from '@/features/notifications/NotificationList';
import { getNotifications } from '@/features/notifications/service';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
	const user = await getUserSession();
	if (!user) redirect('/login?redirect=/notifications');

	return (
		<div className="px-contain mx-auto flex max-w-[1000px] flex-col gap-10 py-6 md:py-10 xl:flex-row xl:items-start">
			<div className="flex min-w-0 flex-1 flex-col gap-5 xl:max-w-[680px]">
				<NotificationsHeader />
				{/* Most Notifications are results, which carry no status chip */}
				<Suspense fallback={<PollRowListSkeleton chip={false} />}>
					<Notifications />
				</Suspense>
			</div>
			<aside className="w-full xl:sticky xl:top-8 xl:w-[260px] xl:shrink-0">
				<TidePanel className="p-3.5 text-[13px] leading-relaxed">
					<p className="mb-1 flex items-center gap-1.5 font-medium">
						<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
						<T k="notifications.railTitle" />
					</p>
					<p>
						<T k="notifications.railBody" />
					</p>
				</TidePanel>
			</aside>
		</div>
	);
}

/** The feed's first page; the list says so when it couldn't load. */
async function Notifications() {
	const result = await getNotifications().catch(() => null);
	return <NotificationList initialPage={result?.ok ? result.data : null} />;
}
