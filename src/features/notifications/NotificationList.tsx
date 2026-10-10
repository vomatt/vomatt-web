'use client';

import Link from 'next/link';

import { LoadMore } from '@/components/LoadMore';
import { Bell } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { isCancelled } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { cn } from '@/lib/utils';

import { markNotificationRead } from './service';
import { useUnreadCount } from './UnreadCountProvider';

const fetchPage = (cursor: string) => getMyPolls('ended', cursor, 20);

export function NotificationList({ initialPage }: { initialPage: CursorPage<Poll> | null }) {
	const { t } = useLanguage();
	const { refresh } = useUnreadCount();
	const list = useCursorList(initialPage, fetchPage);

	// Opening a Poll reads its notification; the list and badge update at once
	const open = (poll: Poll) => {
		if (!poll.unread) return;
		list.setItems((items) => items.map((p) => (p.id === poll.id ? { ...p, unread: false } : p)));
		markNotificationRead(poll.id).then(refresh);
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
						<li key={poll.id}>
							<Link
								href={`/poll/${poll.id}`}
								onClick={() => open(poll)}
								className={cn(
									'flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30',
									poll.unread ? 'border-primary/40' : 'border-border'
								)}
							>
								<span
									aria-label={poll.unread ? t('notifications.unread') : undefined}
									className={cn('size-2 shrink-0 rounded-full', poll.unread ? 'bg-primary' : 'bg-transparent')}
								/>
								<div className="min-w-0 flex-1">
									<p className={cn('truncate leading-snug', poll.unread && 'font-semibold')}>{poll.title}</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{t(isCancelled(poll) ? 'notifications.cancelled' : 'notifications.ended')}
									</p>
								</div>
							</Link>
						</li>
					))}
				</ul>
			)}
			<LoadMore list={list} />
		</div>
	);
}
