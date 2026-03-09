import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Link from 'next/link';

import { Poll } from '@/types/poll';

export default function ProfilePollList({ polls }: { polls: Poll[] }) {
	if (polls.length === 0) {
		return <p className="text-muted-foreground">No polls yet.</p>;
	}

	return (
		<div className="space-y-3">
			{polls.map((poll) => (
				<Link key={poll.id} href={`/poll/${poll.id}`}>
					<div className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
						<p className="font-semibold text-foreground hover:underline">{poll.title}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{poll.totalVotes} votes ·{' '}
							{formatDistance(new Date(poll.createdAt), new Date(), { locale: enUS })} ago
						</p>
					</div>
				</Link>
			))}
		</div>
	);
}
