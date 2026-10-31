import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { Lock } from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
import { getMyProfile, redirectToLogin } from '@/data/auth';
import {
	NotificationList,
	NotificationSettingsLink,
	NotificationsHeader,
} from '@/features/notifications/NotificationList';
import {
	type Notification,
	NOTIFICATION_CATEGORIES,
	type NotificationCategory,
	type NotificationPreferences,
} from '@/features/notifications/schema';
import { getNotificationPreferences, getNotifications } from '@/features/notifications/service';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { CursorPage } from '@/lib/api/cursor';
import { getServerMessages } from '@/lib/getServerLocale';

export async function generateMetadata(): Promise<Metadata> {
	const { messages } = await getServerMessages();
	return { title: messages.notifications.title };
}

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
	const profile = await getMyProfile();
	if (!profile) return redirectToLogin('/notifications');

	const { tab } = await searchParams;
	const category = NOTIFICATION_CATEGORIES.find((value) => value.toLowerCase() === tab);
	// Started together; the list and the rail each stream in when theirs resolves
	const firstPage = getNotifications(null, category).catch(() => null);
	const preferences = getNotificationPreferences().catch(() => null);

	return (
		<PageShell
			rail={
				<Suspense fallback={null}>
					<NotificationsRail firstPage={firstPage} preferences={preferences} />
				</Suspense>
			}
		>
			<div className="flex flex-col gap-5">
				<Suspense
					fallback={
						<>
							<NotificationsHeader />
							<PollRowListSkeleton chip={false} />
						</>
					}
				>
					<Notifications firstPage={firstPage} category={category} viewerUsername={profile.username} />
				</Suspense>
			</div>
		</PageShell>
	);
}

type FirstPage = Promise<CursorPage<Notification> | null>;

async function Notifications({
	firstPage,
	category,
	viewerUsername,
}: {
	firstPage: FirstPage;
	category?: NotificationCategory;
	viewerUsername: string;
}) {
	return <NotificationList initialPage={await firstPage} initialCategory={category} viewerUsername={viewerUsername} />;
}

async function NotificationsRail({
	firstPage,
	preferences,
}: {
	firstPage: FirstPage;
	preferences: Promise<NotificationPreferences | null>;
}) {
	const [page, prefs] = await Promise.all([firstPage, preferences]);
	// How rows are read means nothing until there is a row
	if (page?.items.length === 0) return null;
	return (
		<aside className="flex w-full flex-col gap-3 xl:sticky xl:top-8">
			<TidePanel className="p-3.5 text-caption-1 leading-relaxed">
				<p className="mb-1 flex items-center gap-1.5 font-medium">
					<Lock aria-hidden className="size-3.5 shrink-0 text-tide" />
					<T k="notifications.railTitle" />
				</p>
				<p>
					<T k="notifications.railBody" />
				</p>
			</TidePanel>
			<NotificationSettingsLink preferences={prefs} />
		</aside>
	);
}
