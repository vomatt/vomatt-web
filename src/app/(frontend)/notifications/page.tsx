import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getUserSession } from '@/data/auth';
import { NotificationList } from '@/features/notifications/NotificationList';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { NOTIFICATIONS_PAGE_SIZE } from '@/features/polls/constants';
import { getMyPolls } from '@/features/polls/service';
import { isInvitee } from '@/features/polls/status';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
	const user = await getUserSession();
	if (!user) redirect('/login?redirect=/notifications');

	return (
		<div className="px-contain max-w-2xl mx-auto py-6">
			<Suspense fallback={<PollListSkeleton />}>
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
		getMyPolls('open').catch(() => null),
		getMyPolls('ended', null, NOTIFICATIONS_PAGE_SIZE).catch(() => null),
	]);
	const invitations = (open?.items ?? []).filter((poll) => isInvitee(poll, viewerId));
	return <NotificationList initialPage={firstPage} invitations={invitations} />;
}
