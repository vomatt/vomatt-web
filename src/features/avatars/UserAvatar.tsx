import { AccountAvatar } from './AccountAvatar';
import { BotAvatar } from './BotAvatar';
import { type AvatarChoice, NO_BOT, resolveAvatar, uploadedAvatarSrc } from './catalog';
import { UploadedAvatar } from './UploadedAvatar';

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

export { UploadedAvatar };

/**
 * A person's avatar: their uploaded photo, the bot they chose, the account icon if they chose no character,
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
	const uploaded = uploadedAvatarSrc(avatarUrl);
	// A photo that no longer loads falls back to the bot the username picks
	if (uploaded)
		return (
			<UploadedAvatar
				src={uploaded}
				className={className}
				fallback={<ChosenAvatar kind={resolveAvatar(username, null)} className={className} tooltip={tooltip} />}
			/>
		);
	return <ChosenAvatar kind={resolveAvatar(username, avatarUrl)} className={className} tooltip={tooltip} />;
}
