'use client';

import { useState } from 'react';

import { LoadMore } from '@/components/LoadMore';
import { Bell } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { NOTIFICATIONS_PAGE_SIZE } from '@/features/polls/constants';
import type { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { derivePollStatus, isCancelled } from '@/features/polls/status';
import { UserChip } from '@/features/profiles/UserChip';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';

import { UnreadDot } from './UnreadDot';

const fetchPage = (cursor: string) => getMyPolls('ended', cursor, NOTIFICATIONS_PAGE_SIZE);

const markRead = (polls: Poll[], id: string) =>
	polls.map((poll) => (poll.id === id ? { ...poll, unread: false } : poll));

/** The page's title and intro; rendered outside the list's Suspense boundary. */
export function NotificationsHeader() {
	const { t } = useLanguage();
	return (
		<div>
			<h1 className="display-heading text-[32px] text-foreground md:text-[44px]">{t('notifications.title')}</h1>
			<p className="mt-2 text-[15px] text-muted-foreground">{t('notifications.intro')}</p>
		</div>
	);
}

export function NotificationList({
	initialPage,
	invitations: initialInvitations,
}: {
	/** Ended Notifications; null when they couldn't be loaded. */
	initialPage: CursorPage<Poll> | null;
	/** Scheduled and Open Invite-only Polls the user is invited to. */
	invitations: Poll[];
}) {
	const { t } = useLanguage();
	const list = useCursorList(initialPage, fetchPage);
	const [invitations, setInvitations] = useState(initialInvitations);
	const hasInvitations = invitations.length > 0;

	// The Poll's page marks it read; clear the dot here at once
	const open = (poll: Poll) => {
		if (!poll.unread) return;
		list.setItems((items) => markRead(items, poll.id));
		setInvitations((items) => markRead(items, poll.id));
	};

	const unreadMarker = (poll: Poll) =>
		poll.unread && <UnreadDot label={t('notifications.unread')} className="mr-1.5 align-middle" />;

	let ended: React.ReactNode;
	if (initialPage === null) {
		ended = <p className="py-16 text-center text-muted-foreground">{t('notifications.loadFailed')}</p>;
	} else if (list.items.length === 0 && !hasInvitations) {
		ended = (
			<div className="empty-state flex flex-col items-start gap-3">
				<span className="grid size-11 place-items-center rounded-full bg-secondary text-foreground">
					<Bell className="size-5" />
				</span>
				<p>{t('notifications.empty')}</p>
			</div>
		);
	} else if (list.items.length > 0) {
		ended = (
			<ul className="space-y-2">
				{list.items.map((poll) => (
					<PollListItem
						key={poll.id}
						poll={poll}
						onClick={() => open(poll)}
						meta={
							<>
								{unreadMarker(poll)}
								{t(isCancelled(poll) ? 'notifications.cancelled' : 'notifications.ended')}
							</>
						}
					/>
				))}
			</ul>
		);
	}

	return (
		<div className="space-y-4">
			{hasInvitations && (
				<section className="space-y-3">
					<h2 className="font-medium">{t('notifications.invitations')}</h2>
					<ul className="space-y-2">
						{invitations.map((poll) => (
							<PollListItem
								key={poll.id}
								poll={poll}
								onClick={() => open(poll)}
								aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
								meta={
									<>
										{unreadMarker(poll)}
										<UserChip
											username={poll.creatorUsername}
											avatarUrl={poll.creatorAvatarUrl}
											label={t('notifications.invitedBy', { name: poll.creatorUsername })}
											link={false}
											className="align-middle"
											avatarClassName="size-4"
										/>
									</>
								}
							/>
						))}
					</ul>
				</section>
			)}

			{hasInvitations && list.items.length > 0 && (
				<h2 className="pt-2 font-medium">{t('notifications.results')}</h2>
			)}
			{ended}
			<LoadMore list={list} />
		</div>
	);
}
