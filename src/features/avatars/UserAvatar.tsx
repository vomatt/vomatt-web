import { AccountAvatar } from './AccountAvatar';
import { BotAvatar } from './BotAvatar';
import { type AvatarChoice, NO_BOT, resolveAvatar } from './catalog';

/** Draws a choice: the account icon for no character, else the bot (with its name and trait on hover when `tooltip`). */
export function ChosenAvatar({
	kind,
	className,
	tooltip,
	tooltipBoundary,
}: {
	kind: AvatarChoice;
	className?: string;
	tooltip?: boolean;
	tooltipBoundary?: Element | null;
}) {
	if (kind === NO_BOT) return <AccountAvatar className={className} />;
	return <BotAvatar kind={kind} className={className} tooltip={tooltip} tooltipBoundary={tooltipBoundary} />;
}

/**
 * A person's avatar: the bot they chose, the account icon if they chose no character,
 * or the bot their username picks. Decorative; the name sits beside it.
 */
export function UserAvatar({
	username,
	avatarUrl,
	className,
	tooltip,
}: {
	username: string;
	avatarUrl?: string | null;
	className?: string;
	/** Name and trait of the bot on hover (none for the account icon); only on the profile page. */
	tooltip?: boolean;
}) {
	return <ChosenAvatar kind={resolveAvatar(username, avatarUrl)} className={className} tooltip={tooltip} />;
}
