import Link from 'next/link';

import { ArrowRight } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

import type { Poll } from '../schema';

/** The row's frame, shared with its skeleton so the two stay the same size. */
export const pollRowFrameClassName = 'rounded-xl border border-border bg-card p-4';

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
					pollRowFrameClassName,
					'group flex items-center gap-3 transition-colors hover:border-border-strong',
					className
				)}
			>
				<div className="min-w-0 flex-1 space-y-1.5">
					{aside && <div className="flex gap-2">{aside}</div>}
					<p className="text-title-4 line-clamp-2 leading-snug text-foreground">
						{poll.title}
					</p>
					<p className="text-caption-2 tabular-nums text-muted-foreground">{meta}</p>
				</div>
				<ArrowRight
					aria-hidden
					className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
				/>
			</Link>
		</li>
	);
}
