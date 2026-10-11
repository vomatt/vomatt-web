import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getUserSession } from '@/data/auth';
import { NotificationList } from '@/features/notifications/NotificationList';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { getMyPolls } from '@/features/polls/service';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
	if (!(await getUserSession())) redirect('/login?redirect=/notifications');

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<Suspense fallback={<PollListSkeleton />}>
				<Notifications />
			</Suspense>
		</div>
	);
}

/** Ended Notifications are the user's Ended Polls; each says whether it's unread. */
async function Notifications() {
	const firstPage = await getMyPolls('ended').catch(() => null);
	return <NotificationList initialPage={firstPage} />;
}
