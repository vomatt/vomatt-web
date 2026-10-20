'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useLayoutEffect, useRef, useTransition } from 'react';

import { LoadMore } from '@/components/LoadMore';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { CreatePollTrigger } from '@/features/polls/components/CreatePollTrigger';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { Poll } from '@/features/polls/schema';
import { getUserPolls } from '@/features/polls/service';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';
import { toPayloadLocale } from '@/lib/locale';

/** The user's opened Polls (Open and Ended), most recently opened first. */
export default function ProfilePollList({
	username,
	initialPage,
	isOwn = false,
}: {
	username: string;
	/** The owner's empty list offers the create action */
	isOwn?: boolean;
	/** Null when the first page couldn't load */
	initialPage: CursorPage<Poll> | null;
}) {
	const { t, currentLanguage } = useLanguage();
	const router = useRouter();
	const [isRetrying, startRetry] = useTransition();
	const fetchPage = useCallback((cursor: string) => getUserPolls(username, cursor), [username]);
	const list = useCursorList(initialPage, fetchPage);
	// Try again unmounts once the polls arrive; focus moves to the list that replaced it
	const retried = useRef(false);
	const listRegion = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		if (retried.current && initialPage) {
			retried.current = false;
			listRegion.current?.focus();
		}
	}, [initialPage]);

	if (!initialPage) {
		// Saying "No polls yet" here would be false; the server render fetches them again
		return (
			<div className="empty-state space-y-3">
				<p>{t('profile.pollsLoadFailed')}</p>
				<Button
					variant="outline"
					size="sm"
					loading={isRetrying}
					onClick={() => {
						retried.current = true;
						startRetry(() => router.refresh());
					}}
				>
					{t('common.tryAgain')}
				</Button>
			</div>
		);
	}

	return (
		<div
			ref={listRegion}
			tabIndex={-1}
			className="rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
		>
			{list.items.length === 0 ? (
				isOwn ? (
					<div className="empty-state space-y-3">
						<p>{t('profile.noPollsYetOwn')}</p>
						<CreatePollTrigger>
							<Button size="sm">{t('common.createPoll')}</Button>
						</CreatePollTrigger>
					</div>
				) : (
					<p className="empty-state">{t('profile.noPollsYet')}</p>
				)
			) : (
				<>
					<ul className="space-y-2">
						{list.items.map((poll) => (
							<PollListItem
								key={poll.id}
								poll={poll}
								meta={t('poll.voted', {
									count: (getTurnout(poll) ?? 0).toLocaleString(toPayloadLocale(currentLanguage)),
								})}
								aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
							/>
						))}
					</ul>
					<LoadMore list={list} />
				</>
			)}
		</div>
	);
}
