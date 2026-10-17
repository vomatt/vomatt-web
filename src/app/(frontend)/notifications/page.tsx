import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getUserSession } from '@/data/auth';
import { NotificationList, NotificationsHeader } from '@/features/notifications/NotificationList';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { NOTIFICATIONS_PAGE_SIZE } from '@/features/polls/constants';
import { getAllMyPolls, getMyPolls } from '@/features/polls/service';
import { isInvitee } from '@/features/polls/status';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
	const user = await getUserSession();
	if (!user) redirect('/login?redirect=/notifications');

	return (
		<div className="px-contain max-w-2xl mx-auto space-y-4 py-6">
			<NotificationsHeader />
			{/* Most Notifications are results, which carry no status chip */}
			<Suspense fallback={<PollRowListSkeleton chip={false} />}>
				<Notifications viewerId={user.sub} />
			</Suspense>
		</div>
	);
}

/**
 * Invitations are the Scheduled and Open Invite-only Polls of someone else in
 * My Polls; Ended Notifications are the user's Ended Polls. Each says whether it's unread.
 */
async function Notifications({ viewerId }: { viewerId: string }) {
	const [open, firstPage] = await Promise.all([
		// Every page: an Invitation can sort anywhere in the Open list
		getAllMyPolls('open').catch(() => null),
		getMyPolls('ended', null, NOTIFICATIONS_PAGE_SIZE).catch(() => null),
	]);
	const invitations = (open ?? []).filter((poll) => isInvitee(poll, viewerId));
	return <NotificationList initialPage={firstPage} invitations={invitations} />;
}
