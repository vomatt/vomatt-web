'use client';

import { LoadMore } from '@/components/LoadMore';
import { Bell } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { NOTIFICATIONS_PAGE_SIZE } from '@/features/polls/constants';
import type { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { isCancelled } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';

import { UnreadDot } from './UnreadDot';

const fetchPage = (cursor: string) => getMyPolls('ended', cursor, NOTIFICATIONS_PAGE_SIZE);

export function NotificationList({ initialPage }: { initialPage: CursorPage<Poll> | null }) {
	const { t } = useLanguage();
	const list = useCursorList(initialPage, fetchPage);

	// The Poll's page marks it read; clear the dot here at once
	const open = (poll: Poll) => {
		if (!poll.unread) return;
		list.setItems((items) => items.map((p) => (p.id === poll.id ? { ...p, unread: false } : p)));
	};

	return (
		<div className="space-y-4">
			<div>
				<h1 className="display-heading text-[32px] text-foreground md:text-[44px]">{t('notifications.title')}</h1>
				<p className="mt-2 text-[15px] text-muted-foreground">{t('notifications.intro')}</p>
			</div>

			{initialPage === null ? (
				<p className="py-16 text-center text-muted-foreground">{t('notifications.loadFailed')}</p>
			) : list.items.length === 0 ? (
				<div className="empty-state flex flex-col items-start gap-3">
					<span className="grid size-11 place-items-center rounded-full bg-secondary text-foreground">
						<Bell className="size-5" />
					</span>
					<p>{t('notifications.empty')}</p>
				</div>
			) : (
				<ul className="space-y-2">
					{list.items.map((poll) => (
						<PollListItem
							key={poll.id}
							poll={poll}
							onClick={() => open(poll)}
							className={poll.unread ? 'border-foreground/40' : undefined}
							meta={
								<>
									{poll.unread && (
										<UnreadDot label={t('notifications.unread')} className="mr-1.5 align-middle" />
									)}
									{t(isCancelled(poll) ? 'notifications.cancelled' : 'notifications.ended')}
								</>
							}
						/>
					))}
				</ul>
			)}
			<LoadMore list={list} />
		</div>
	);
}
