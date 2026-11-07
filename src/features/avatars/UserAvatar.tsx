import { cn } from '@/lib/utils';

import { AccountAvatar } from './AccountAvatar';
import { BotAvatar } from './BotAvatar';
import { type AvatarChoice, NO_BOT, resolveAvatar, uploadedAvatarSrc } from './catalog';

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

/** An uploaded photo, already square; drawn in the same frame as the cast. */
export function UploadedAvatar({ src, className }: { src: string; className?: string }) {
	return (
		// eslint-disable-next-line @next/next/no-img-element -- a small fixed image served by the API
		<img src={src} alt="" loading="lazy" className={cn('avatar-frame object-cover', className)} />
	);
}

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
	if (uploaded) return <UploadedAvatar src={uploaded} className={className} />;
	return <ChosenAvatar kind={resolveAvatar(username, avatarUrl)} className={className} tooltip={tooltip} />;
}
