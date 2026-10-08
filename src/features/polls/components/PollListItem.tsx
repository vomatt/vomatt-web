import Link from 'next/link';

import type { Poll } from '../schema';

type PollListItemProps = {
	poll: Pick<Poll, 'id' | 'title'>;
	/** The muted line under the title. */
	meta: React.ReactNode;
	/** Shown at the right, e.g. a status chip or outcome. */
	aside?: React.ReactNode;
};

/** A compact, linked poll row for lists (account, explore). */
export function PollListItem({ poll, meta, aside }: PollListItemProps) {
	return (
		<li>
			<Link
				href={`/poll/${poll.id}`}
				className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
			>
				<div className="min-w-0 flex-1">
					<p className="truncate leading-snug text-foreground">{poll.title}</p>
					<p className="mt-1 text-xs tabular-nums text-muted-foreground">{meta}</p>
				</div>
				{aside && <div className="shrink-0">{aside}</div>}
			</Link>
		</li>
	);
}
