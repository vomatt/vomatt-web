import { User } from '@/components/ui/SvgIcons';
import { cn } from '@/lib/utils';

/** The plain account icon on a muted circle, for a user who chose no character. Size comes from `className` (default 32px). */
export function AccountAvatar({ className }: { className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				'avatar-frame grid place-items-center bg-muted text-muted-foreground',
				className
			)}
		>
			<User className="size-3/5" />
		</span>
	);
}

/** "+3" on the account avatar's muted circle, for people a list counts but can't show. */
export function CountAvatar({ count, className }: { count: number; className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				'avatar-frame grid place-items-center bg-muted text-caption-2 text-muted-foreground tabular-nums',
				className
			)}
		>
			+{count}
		</span>
	);
}
