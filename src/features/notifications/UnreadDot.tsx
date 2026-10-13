import { cn } from '@/lib/utils';

/** The Volt dot that marks something unread. */
export function UnreadDot({ label, className }: { label: string; className?: string }) {
	return (
		<span
			aria-label={label}
			className={cn('inline-block size-2.5 rounded-full bg-volt ring-1 ring-foreground/40', className)}
		/>
	);
}
