import { CircleMinus } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

/**
 * A page's empty or missing state: a centered card with an icon disc, a title, one line of
 * body and an optional action. Lists inside a panel or dialog keep the `empty-state` box.
 */
export function EmptyCard({
	icon = <CircleMinus />,
	title,
	body,
	action,
	headingLevel = 2,
	className,
}: {
	/** The artboards' circle-minus unless a state has a better one. */
	icon?: React.ReactNode;
	title: React.ReactNode;
	body?: React.ReactNode;
	action?: React.ReactNode;
	/** 1 on a page with no other title (404, poll not found), so the page still has an h1. */
	headingLevel?: 1 | 2;
	className?: string;
}) {
	const Heading = headingLevel === 1 ? 'h1' : 'h2';
	return (
		<div
			className={cn(
				'flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card px-8 py-14 text-center',
				className
			)}
		>
			<span aria-hidden className="mb-1.5 inline-flex size-14 items-center justify-center rounded-full bg-field text-muted-foreground [&_svg]:size-6">
				{icon}
			</span>
			<Heading className="text-[21px] font-medium tracking-[-0.02em] text-foreground">{title}</Heading>
			{body && <p className="max-w-[420px] text-[15px] text-muted-foreground">{body}</p>}
			{action && <div className="mt-3.5">{action}</div>}
		</div>
	);
}
