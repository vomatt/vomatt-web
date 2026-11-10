import Link from 'next/link';

import { UserAvatar } from '@/features/avatars/UserAvatar';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import { OfficialBadge } from './OfficialBadge';
import { ProfileHoverCard } from './ProfileHoverCard';

type Person = { username: string; avatarUrl?: string | null };
/** An official account gets the badge after its name. */
type Official = { official?: boolean | null };

/**
 * A person's avatar and username as one unit: a link to their profile, with a
 * profile card on hover. `label` replaces the username text, e.g. "mei invited you".
 * Pass `link={false}` inside another link (a poll row); there that row link is
 * what keyboard users reach, and the card is for mouse hover only.
 */
export function UserChip({
	username,
	avatarUrl,
	label = username,
	official,
	link = true,
	className,
	avatarClassName,
}: Person & Official & {
	label?: string;
	link?: boolean;
	className?: string;
	avatarClassName?: string;
}) {
	const classes = cn('inline-flex min-w-0 items-center gap-1.5', className);
	const content = (
		<>
			<UserAvatar username={username} avatarUrl={avatarUrl} className={avatarClassName} />
			<span className="truncate">{label}</span>
			{official && <OfficialBadge />}
		</>
	);
	return (
		<ProfileHoverCard username={username} avatarUrl={avatarUrl}>
			{link ? (
				<Link href={profileHref(username)} className={classes}>
					{content}
				</Link>
			) : (
				<span className={classes}>{content}</span>
			)}
		</ProfileHoverCard>
	);
}

/** The avatar alone, for layouts that set it apart from the name; pair it with `ProfileName`. */
export function ProfileAvatar({ username, avatarUrl, className }: Person & { className?: string }) {
	return (
		<ProfileHoverCard username={username} avatarUrl={avatarUrl}>
			{/* The name beside it is the link people tab to and screen readers announce */}
			<Link href={profileHref(username)} tabIndex={-1} aria-hidden className="shrink-0">
				<UserAvatar username={username} avatarUrl={avatarUrl} className={className} />
			</Link>
		</ProfileHoverCard>
	);
}

/** The username alone as a profile link with the hover card; see `ProfileAvatar`. */
export function ProfileName({ username, avatarUrl, official, className }: Person & Official & { className?: string }) {
	return (
		<ProfileHoverCard username={username} avatarUrl={avatarUrl}>
			<Link href={profileHref(username)} className={cn(official && 'inline-flex items-center gap-1', className)}>
				{username}
				{official && <OfficialBadge />}
			</Link>
		</ProfileHoverCard>
	);
}
