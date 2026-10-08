import { cn } from '@/lib/utils';

/** A circle with the first letter of a name, until users have avatars. Size and colour come from `className`. */
export function InitialAvatar({ name, className }: { name: string; className?: string }) {
	return (
		<div
			aria-hidden
			className={cn(
				'grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground',
				className
			)}
		>
			{name.slice(0, 1)}
		</div>
	);
}
