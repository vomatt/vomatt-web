import { BotAvatar } from './BotAvatar';
import { resolveAvatar } from './catalog';

/** A person's avatar: the bot they chose, or the one their username picks. Decorative; the name sits beside it. */
export function UserAvatar({
	username,
	avatarUrl,
	className,
}: {
	username: string;
	avatarUrl?: string | null;
	className?: string;
}) {
	return <BotAvatar kind={resolveAvatar(username, avatarUrl)} className={className} />;
}
