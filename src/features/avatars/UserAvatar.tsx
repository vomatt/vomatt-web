import { BotAvatar } from './BotAvatar';
import { resolveAvatar } from './catalog';

/** A person's avatar: the bot they chose, or the one their username picks. Decorative; the name sits beside it. */
export function UserAvatar({
	username,
	avatarUrl,
	className,
	tooltip,
}: {
	username: string;
	avatarUrl?: string | null;
	className?: string;
	/** Name and trait of the bot on hover; only on the profile page. */
	tooltip?: boolean;
}) {
	return <BotAvatar kind={resolveAvatar(username, avatarUrl)} className={className} tooltip={tooltip} />;
}
