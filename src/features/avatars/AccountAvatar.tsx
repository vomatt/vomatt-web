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
