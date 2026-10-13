import Link from 'next/link';

import { ArrowRight } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

import type { Poll } from '../schema';

type PollListItemProps = {
	poll: Pick<Poll, 'id' | 'title'>;
	/** The muted line under the title. */
	meta: React.ReactNode;
	/** Shown above the title, e.g. a status chip or outcome. */
	aside?: React.ReactNode;
	onClick?: () => void;
	className?: string;
};

/** A compact, linked poll row for lists (account, explore). */
export function PollListItem({ poll, meta, aside, onClick, className }: PollListItemProps) {
	return (
		<li>
			<Link
				href={`/poll/${poll.id}`}
				onClick={onClick}
				className={cn(
					'group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:border-border-strong',
					className
				)}
			>
				<div className="min-w-0 flex-1 space-y-1.5">
					{aside && <div className="flex">{aside}</div>}
					<p className="line-clamp-2 text-[17px] leading-snug tracking-[-0.01em] text-foreground">
						{poll.title}
					</p>
					<p className="text-[13px] tabular-nums text-muted-foreground">{meta}</p>
				</div>
				<ArrowRight
					aria-hidden
					className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
				/>
			</Link>
		</li>
	);
}
