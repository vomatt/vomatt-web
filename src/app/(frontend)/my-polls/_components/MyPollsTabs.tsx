'use client';
import { useState } from 'react';

import { LoadMore } from '@/components/LoadMore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import { DraftList } from '@/features/polls/components/DraftList';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';

type Tab = 'active' | 'drafts' | 'ended';

const fetchOpen = () => getMyPolls('open');
const fetchEnded = () => getMyPolls('ended');

function PollRow({ poll }: { poll: Poll }) {
	const { t } = useLanguage();
	return (
		<PollListItem
			poll={poll}
			meta={
				<>
					{poll.unread && (
						<UnreadDot label={t('notifications.unread')} className="mr-1.5 align-middle" />
					)}
					{t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })}
				</>
			}
			aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
		/>
	);
}

/** "12", or "12+" while more pages remain. */
function countLabel(list: { items: unknown[]; hasMore: boolean }) {
	return `${list.items.length}${list.hasMore ? '+' : ''}`;
}

/**
 * Active: Scheduled and Open Polls the user created, plus Open ones they voted
 * in. Ended: Ended and Cancelled ones of either kind.
 */
export default function MyPollsTabs({
	open,
	ended,
}: {
	open: CursorPage<Poll>;
	ended: CursorPage<Poll>;
}) {
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState<Tab>('active');
	const openList = useCursorList(open, fetchOpen);
	const endedList = useCursorList(ended, fetchEnded);
	const lists = { active: openList, ended: endedList };

	return (
		<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
			<TabsList variant="line" className="mb-4">
				<TabsTrigger value="active">
					{t('myPolls.tabActive')} ({countLabel(openList)})
				</TabsTrigger>
				<TabsTrigger value="drafts">{t('myPolls.tabDrafts')}</TabsTrigger>
				<TabsTrigger value="ended">
					{t('myPolls.tabEnded')} ({countLabel(endedList)})
				</TabsTrigger>
			</TabsList>

			<TabsContent value="drafts" className="space-y-3">
				<DraftList />
			</TabsContent>
			{(['active', 'ended'] as const).map((tab) => (
				<TabsContent key={tab} value={tab} className="space-y-3">
					{lists[tab].items.length === 0 ? (
						<p className="empty-state text-center">{t('myPolls.empty')}</p>
					) : (
						<ul className="space-y-2">
							{lists[tab].items.map((poll) => (
								<PollRow key={poll.id} poll={poll} />
							))}
						</ul>
					)}
					<LoadMore list={lists[tab]} />
				</TabsContent>
			))}
		</Tabs>
	);
}
