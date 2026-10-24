import { cn } from '@/lib/utils';

/** The Alert dot that marks something unread; `label` is read out as part of the surrounding text. */
export function UnreadDot({ label, className }: { label: string; className?: string }) {
	return (
		<span className={cn('inline-block size-2 rounded-full bg-alert', className)}>
			<span className="sr-only">{label}</span>
		</span>
	);
}
