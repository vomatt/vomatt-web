import { cn } from '@/lib/utils';

/**
 * Tide, the promise: a surface for what vomatt guarantees (the seal, the rules).
 * Never for links, buttons, headers or hovers.
 */
function TidePanel({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="tide-panel"
			className={cn('rounded-xl border border-tide-line bg-tide-tint text-tide-foreground', className)}
			{...props}
		/>
	);
}

/** A list of rules on a Tide surface; each `TideRule` leads with its icon. */
function TideRules({ className, ...props }: React.ComponentProps<'ul'>) {
	return (
		<ul
			data-slot="tide-rules"
			className={cn(
				'space-y-2.5 rounded-xl border border-tide-line bg-tide-tint p-4 text-[14px] leading-relaxed text-tide-foreground',
				className
			)}
			{...props}
		/>
	);
}

function TideRule({
	icon: Icon,
	children,
}: {
	icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
	children: React.ReactNode;
}) {
	return (
		<li className="flex gap-2.5">
			<Icon aria-hidden className="mt-[3px] size-4 shrink-0 text-tide" />
			<span className="min-w-0">{children}</span>
		</li>
	);
}

export { TidePanel, TideRule, TideRules };
