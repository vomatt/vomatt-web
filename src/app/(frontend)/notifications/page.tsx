import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { T } from '@/components/T';
import { Lock } from '@/components/ui/SvgIcons';
import { TidePanel } from '@/components/ui/TidePanel';
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
		<div className="px-contain mx-auto flex max-w-[1000px] flex-col gap-10 pt-8 pb-16 xl:flex-row xl:items-start">
			<Suspense
				fallback={
					<Column>
						<NotificationsHeader />
						{/* Most Notifications are results, which carry no status chip */}
						<PollRowListSkeleton chip={false} />
					</Column>
				}
			>
				<Notifications viewerId={user.sub} />
			</Suspense>
		</div>
	);
}

function Column({ children }: { children: React.ReactNode }) {
	return <div className="flex min-w-0 flex-1 flex-col gap-5 xl:max-w-[680px]">{children}</div>;
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
	const empty = firstPage?.items.length === 0 && invitations.length === 0;
	return (
		<>
			<Column>
				<NotificationList initialPage={firstPage} invitations={invitations} />
			</Column>
			{/* How rows are read means nothing until there is a row */}
			{!empty && (
				<aside className="w-full xl:sticky xl:top-8 xl:w-[280px] xl:shrink-0">
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
			)}
		</>
	);
}
