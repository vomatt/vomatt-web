'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { PollListItem } from '@/features/polls/components/PollListItem';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { Poll } from '@/features/polls/schema';
import { derivePollStatus, getTurnout } from '@/features/polls/status';

export default function ProfilePollList({ polls }: { polls: Poll[] }) {
	const { t } = useLanguage();
	if (polls.length === 0) {
		return <p className="text-muted-foreground">{t('profile.noPollsYet')}</p>;
	}

	return (
		<ul className="space-y-3">
			{polls.map((poll) => (
				<PollListItem
					key={poll.id}
					poll={poll}
					meta={t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() })}
					aside={<StatusChip status={derivePollStatus(poll)} poll={poll} />}
				/>
			))}
		</ul>
	);
}
