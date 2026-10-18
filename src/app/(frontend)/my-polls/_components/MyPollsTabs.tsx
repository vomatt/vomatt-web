'use client';
import { useState } from 'react';

import { LoadMore } from '@/components/LoadMore';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnreadDot } from '@/features/notifications/UnreadDot';
import { DraftList } from '@/features/polls/components/DraftList';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { derivePollStatus, getTurnout } from '@/features/polls/status';
import { useCursorList } from '@/hooks/useCursorList';
import type { CursorPage } from '@/lib/api/cursor';

type Tab = 'active' | 'drafts' | 'ended';

const fetchOpen = (cursor: string) => getMyPolls('open', cursor);
const fetchEnded = (cursor: string) => getMyPolls('ended', cursor);

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

/** The tabs themselves; counts are left out while the lists load. */
function MyPollsTabList({ activeCount, endedCount }: { activeCount?: string; endedCount?: string }) {
	const { t } = useLanguage();
	return (
		<TabsList variant="line">
			<TabsTrigger value="active">
				{t('myPolls.tabActive')}
				{activeCount && ` (${activeCount})`}
			</TabsTrigger>
			<TabsTrigger value="drafts">{t('myPolls.tabDrafts')}</TabsTrigger>
			<TabsTrigger value="ended">
				{t('myPolls.tabEnded')}
				{endedCount && ` (${endedCount})`}
			</TabsTrigger>
			<TabsIndicator />
		</TabsList>
	);
}

/** The real tab list over placeholder rows, so the loaded tabs land in place. */
export function MyPollsTabsSkeleton() {
	return (
		<Tabs value="active" className="gap-6">
			<MyPollsTabList />
			<TabsContent value="active">
				<PollRowListSkeleton />
			</TabsContent>
		</Tabs>
	);
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
		<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="gap-6">
			<MyPollsTabList activeCount={countLabel(openList)} endedCount={countLabel(endedList)} />

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
