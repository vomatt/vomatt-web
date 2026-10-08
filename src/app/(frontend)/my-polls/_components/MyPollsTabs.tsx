'use client';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { DraftList } from '@/features/polls/components/DraftList';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { Poll } from '@/features/polls/schema';
import { derivePollStatus, getTurnout } from '@/features/polls/status';

type Tab = 'active' | 'drafts' | 'ended';

function PollRow({ poll }: { poll: Poll }) {
	const { t } = useLanguage();
	return (
		<PollListItem
			poll={poll}
			meta={t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })}
			aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
		/>
	);
}

export default function MyPollsTabs({ polls }: { polls: Poll[] }) {
	const [activeTab, setActiveTab] = useState<Tab>('active');

	const activePolls = polls.filter((p) => p.active && p.votingActive);
	const endedPolls = polls.filter((p) => !p.active || !p.votingActive);

	const tabContent: Record<Tab, Poll[]> = {
		active: activePolls,
		drafts: [],
		ended: endedPolls,
	};

	return (
		<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
			<TabsList className="mb-4">
				<TabsTrigger value="active">Active ({activePolls.length})</TabsTrigger>
				<TabsTrigger value="drafts">Drafts</TabsTrigger>
				<TabsTrigger value="ended">Ended ({endedPolls.length})</TabsTrigger>
			</TabsList>

			{(['active', 'drafts', 'ended'] as Tab[]).map((tab) => (
				<TabsContent key={tab} value={tab} className="space-y-3">
					{tab === 'drafts' ? (
						<DraftList />
					) : tabContent[tab].length === 0 ? (
						<p className="text-muted-foreground text-center py-8">
							No polls here yet.
						</p>
					) : (
						tabContent[tab].map((poll) => <PollRow key={poll.id} poll={poll} />)
					)}
				</TabsContent>
			))}
		</Tabs>
	);
}
