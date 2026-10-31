'use client';

import Link from 'next/link';

import { Globe } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFieldPublic } from '@/features/account/visibility';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { formatMonthYear } from '@/features/polls/format';
import { Count } from '@/features/profiles/Count';
import { profileName } from '@/features/profiles/name';
import { countText } from '@/lib/count';
import { profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { MyProfile } from '@/types/user';

/** What everyone else sees of the owner's profile: beside their own view, or in its place on narrow screens. */
export function PublicPreview({ profile, className }: { profile: MyProfile; className?: string }) {
	const { t, currentLanguage } = useLanguage();
	const visibility = profile.visibilitySettings ?? {};
	const shows = (field: 'displayName' | 'bio' | 'firstName' | 'lastName') =>
		isFieldPublic(visibility, field) && !!profile[field];
	// Built from what visitors get, so hidden names never leak into the preview
	const name = profileName({
		username: profile.username,
		displayName: shows('displayName') ? profile.displayName : null,
		firstName: shows('firstName') ? profile.firstName : null,
		lastName: shows('lastName') ? profile.lastName : null,
	});

	return (
		<section aria-labelledby="public-preview" className={cn('flex flex-col gap-3', className)}>
			<h2 id="public-preview" className="flex items-center gap-1.5 text-caption-2 font-medium text-muted-foreground">
				<Globe aria-hidden className="size-3.5" />
				{t('profile.everyoneSees')}
			</h2>
			<div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
				<div className="flex items-center gap-3">
					<UserAvatar username={profile.username} avatarUrl={profile.avatarUrl} className="size-11" />
					<div className="min-w-0">
						<p className="truncate text-title-4 leading-tight">
							{name.primary}
							{name.secondary && <span className="text-muted-foreground"> {name.secondary}</span>}
						</p>
						<p className="truncate text-caption-2 text-muted-foreground">@{profile.username}</p>
					</div>
				</div>
				{shows('bio') && <p className="line-clamp-3 wrap-anywhere text-caption-1">{profile.bio}</p>}
				<p className="text-caption-2 text-muted-foreground">
					{t('profile.joined', { date: formatMonthYear(profile.joinedAt, currentLanguage) })}
				</p>
				<p className="text-caption-2 text-muted-foreground">
					<Count value={profile.totalPolls} label={countText(t, 'profile.recordAskedCount', profile.totalPolls, currentLanguage)} />
					{' · '}
					<Count value={profile.totalVotes} label={countText(t, 'profile.recordVotedCount', profile.totalVotes, currentLanguage)} />
				</p>
				<Link
					href={`${profileHref(profile.username)}?view=public`}
					className="self-start rounded-sm text-caption-1 font-medium underline underline-offset-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
				>
					{t('profile.openPublicPage')}
				</Link>
			</div>
		</section>
	);
}
