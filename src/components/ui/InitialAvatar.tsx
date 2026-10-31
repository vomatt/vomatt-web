import { cn } from '@/lib/utils';

/** A circle with the first letter of a name, for people without a username (and so no avatar). Size and colour come from `className`. */
export function InitialAvatar({ name, className }: { name: string; className?: string }) {
	return (
		<div
			aria-hidden
			className={cn(
				'avatar-frame grid place-items-center bg-muted text-caption-3 font-semibold uppercase text-muted-foreground',
				className
			)}
		>
			{name.slice(0, 1)}
		</div>
	);
}
