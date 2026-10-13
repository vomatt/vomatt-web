'use client';

import { LoadMore } from '@/components/LoadMore';
import { Bell } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollListItem } from '@/features/polls/components/PollListItem';
import type { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { isCancelled } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';

const fetchPage = () => getMyPolls('ended');

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
				<h1 className="text-[32px] font-normal leading-tight tracking-[-0.03em] text-foreground md:text-[44px]">{t('notifications.title')}</h1>
				<p className="mt-2 text-[15px] text-muted-foreground">{t('notifications.intro')}</p>
			</div>

			{initialPage === null ? (
				<p className="py-16 text-center text-muted-foreground">{t('notifications.loadFailed')}</p>
			) : list.items.length === 0 ? (
				<div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border-strong bg-surface-soft px-5 py-8 text-muted-foreground">
					<span className="grid size-11 place-items-center rounded-full bg-secondary text-foreground">
						<Bell className="size-5" />
					</span>
					<p className="text-[15px]">{t('notifications.empty')}</p>
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
										<span
											aria-label={t('notifications.unread')}
											className="mr-1.5 inline-block size-2.5 rounded-full bg-volt align-middle ring-1 ring-foreground/40"
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
