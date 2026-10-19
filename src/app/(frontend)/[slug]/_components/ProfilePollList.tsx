'use client';

import { useCallback } from 'react';

import { LoadMore } from '@/components/LoadMore';
import { useLanguage } from '@/contexts/LanguageContext';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { Poll } from '@/features/polls/schema';
import { getUserPolls } from '@/features/polls/service';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';

/** The user's opened Polls (Open and Ended), most recently opened first. */
export default function ProfilePollList({
	username,
	initialPage,
}: {
	username: string;
	initialPage: CursorPage<Poll>;
}) {
	const { t } = useLanguage();
	const fetchPage = useCallback((cursor: string) => getUserPolls(username, cursor), [username]);
	const list = useCursorList(initialPage, fetchPage);

	if (list.items.length === 0) {
		return <p className="empty-state">{t('profile.noPollsYet')}</p>;
	}

	return (
		<>
			<ul className="space-y-2">
				{list.items.map((poll) => (
					<PollListItem
						key={poll.id}
						poll={poll}
						meta={t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })}
						aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
					/>
				))}
			</ul>
			<LoadMore list={list} />
		</>
	);
}
