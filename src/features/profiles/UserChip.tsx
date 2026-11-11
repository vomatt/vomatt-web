import Link from 'next/link';

import { UserAvatar } from '@/features/avatars/UserAvatar';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import { CommunityBadge } from './CommunityBadge';
import { type NameParts, shownName } from './name';
import { ProfileHoverCard } from './ProfileHoverCard';

/** The names are those the person's visibility settings let the API send; hidden ones are null. */
type Person = NameParts & { avatarUrl?: string | null };
/** A community account gets the badge after its name. */
type Community = { community?: boolean | null };

/**
 * A person's avatar and name as one unit: a link to their profile, with a
 * profile card on hover. A public name leads, then the @handle; with none, `label`
 * (the username by default) stands alone.
 * Pass `link={false}` inside another link (a poll row); there that row link is
 * what keyboard users reach, and the card is for mouse hover only.
 */
export function UserChip({
	username,
	avatarUrl,
	displayName,
	firstName,
	lastName,
	label = username,
	community,
	link = true,
	className,
	avatarClassName,
}: Person & Community & {
	label?: string;
	link?: boolean;
	className?: string;
	avatarClassName?: string;
}) {
	const classes = cn('inline-flex min-w-0 items-center gap-1.5', className);
	const content = (
		<>
			<UserAvatar username={username} avatarUrl={avatarUrl} className={avatarClassName} />
			<NameAndHandle name={shownName({ username, displayName, firstName, lastName })} username={username} fallback={label} />
			{community && <CommunityBadge />}
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

/** The name alone as a profile link with the hover card; see `ProfileAvatar`. */
export function ProfileName({
	username,
	avatarUrl,
	displayName,
	firstName,
	lastName,
	community,
	className,
}: Person & Community & { className?: string }) {
	return (
		<ProfileHoverCard username={username} avatarUrl={avatarUrl}>
			<Link href={profileHref(username)} className={cn(community && 'inline-flex items-center gap-1', className)}>
				<NameAndHandle name={shownName({ username, displayName, firstName, lastName })} username={username} fallback={username} />
				{community && <CommunityBadge />}
			</Link>
		</ProfileHoverCard>
	);
}

/** A public name with the @handle under it; with no public name, `fallback` alone on one line. */
export function NameAndHandle({ name, username, fallback }: { name: string | null; username: string; fallback: string }) {
	if (!name) return <span className="truncate">{fallback}</span>;
	return (
		<span className="inline-flex min-w-0 flex-col">
			<span className="truncate">{name}</span>{' '}
			<span className="truncate text-caption-2 font-normal text-muted-foreground">@{username}</span>
		</span>
	);
}
