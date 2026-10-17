import { cn } from '@/lib/utils';

/** The Volt dot that marks something unread; `label` is read out as part of the surrounding text. */
export function UnreadDot({ label, className }: { label: string; className?: string }) {
	return (
		<span className={cn('inline-block size-2.5 rounded-full bg-volt ring-1 ring-foreground/40', className)}>
			<span className="sr-only">{label}</span>
		</span>
	);
}
