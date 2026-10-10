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
				<h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
				<p className="mt-1 text-sm text-muted-foreground">{t('notifications.intro')}</p>
			</div>

			{initialPage === null ? (
				<p className="py-16 text-center text-muted-foreground">{t('notifications.loadFailed')}</p>
			) : list.items.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
					<Bell className="h-12 w-12 opacity-30" />
					<p>{t('notifications.empty')}</p>
				</div>
			) : (
				<ul className="space-y-2.5">
					{list.items.map((poll) => (
						<PollListItem
							key={poll.id}
							poll={poll}
							onClick={() => open(poll)}
							className={poll.unread ? 'border-primary/40 font-semibold' : undefined}
							meta={
								<>
									{poll.unread && (
										<span
											aria-label={t('notifications.unread')}
											className="mr-1.5 inline-block size-2 rounded-full bg-primary align-middle"
										/>
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
