'use client';

import type { ReactNode } from 'react';

import { Lock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { AvatarDialog } from '@/features/avatars/AvatarDialog';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import type { FollowList } from '@/features/follows/FollowListDialog';
import { Count } from '@/features/profiles/Count';
import { profileDetails } from '@/features/profiles/details';
import { countText } from '@/lib/count';
import { toPayloadLocale } from '@/lib/locale';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/user';

type HeaderProfile = Pick<
	UserProfile,
	| 'username'
	| 'displayName'
	| 'bio'
	| 'joinedAt'
	| 'avatarUrl'
	| 'location'
	| 'points'
	| 'membershipLevel'
	| 'followersCount'
	| 'followingCount'
	| 'followsYou'
	| 'mutualFollowersCount'
	| 'mutualFollowersPreview'
>;

const detailLink =
	'rounded-sm transition-colors hover:text-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

/**
 * The same header for the owner and for visitors. Visitors get only the fields
 * the owner made public: the API sends hidden ones as null, so they drop out.
 * The owner sees every field, with one lock beside each detail only they see;
 * their avatar opens the dialog to change it.
 */
export default function ProfileHeader({
	profile,
	actions,
	isOwn = false,
	hiddenFields = [],
	onOpenList,
}: {
	profile: HeaderProfile;
	/** Edit profile and Settings for the owner; Follow and ••• for a visitor. */
	actions?: ReactNode;
	isOwn?: boolean;
	/** Fields visitors don't see; only the owner's header passes them */
	hiddenFields?: readonly string[];
	/** Opens the followers or following list; signed in only, as the lists are. */
	onOpenList?: (list: FollowList) => void;
}) {
	const { t, currentLanguage } = useLanguage();
	const name = profile.displayName || profile.username;
	const isHidden = (field: string) => hiddenFields.includes(field);
	const details = profileDetails(profile, t, currentLanguage);
	const before = details.filter((part) => part.field === 'location' || part.field === 'points');
	const after = details.filter((part) => part.field !== 'location' && part.field !== 'points');

	const detail = (part: { field: string; text: string }) => (
		<span key={part.field} className={cn('inline-flex items-center gap-1', part.field === 'points' && 'font-mono tabular-nums')}>
			{part.text}
			{isHidden(part.field) && <OnlyYouMarker className="size-3" />}
		</span>
	);

	const listLink = (list: FollowList, count: number | undefined) => (
		<button key={list} type="button" onClick={() => onOpenList?.(list)} className={detailLink}>
			{count === undefined ? (
				t(list === 'followers' ? 'profile.followers' : 'profile.following')
			) : (
				<Count
					value={count}
					label={countText(t, list === 'followers' ? 'profile.followersCount' : 'profile.followingCount', count, currentLanguage)}
				/>
			)}
		</button>
	);

	// "Followed by @a, @b and 2 others you follow"
	const mutualText = (count: number, preview: NonNullable<HeaderProfile['mutualFollowersPreview']>) => {
		const names = preview.map((user) => `@${user.username}`).join(', ');
		const others = count - preview.length;
		if (others <= 0) return t('profile.mutualFollowedBy', { names });
		return t(others === 1 ? 'profile.mutualOthers_one' : 'profile.mutualOthers', {
			names,
			count: others.toLocaleString(toPayloadLocale(currentLanguage)),
		});
	};

	return (
		<header className="flex flex-wrap items-start gap-5">
			{isOwn ? (
				<AvatarDialog username={profile.username} avatarUrl={profile.avatarUrl} className="size-18 md:size-22" />
			) : (
				<UserAvatar username={profile.username} avatarUrl={profile.avatarUrl} className="size-18 md:size-22" />
			)}
			<div className="min-w-0 flex-[1_1_20rem]">
				<h1 className="wrap-anywhere display-heading text-[26px] md:text-[30px]">
					{name}
					{isHidden('displayName') && <OnlyYouMarker className="ml-2 size-4 align-baseline" />}
				</h1>
				<p className="wrap-anywhere font-mono text-[14px] text-muted-foreground">
					@{profile.username}
					{profile.followsYou && (
						<span className="ml-2 rounded-full bg-secondary px-2 py-0.5 align-middle font-sans text-[11px] font-medium">
							{t('follows.followsYou')}
						</span>
					)}
				</p>
				{profile.bio && (
					// Capped measure (~68 characters); Geist's wide 0 makes `ch` overshoot, so the cap is in rem
					<p className="mt-2.5 max-w-[30rem] wrap-anywhere whitespace-pre-line text-[14px]">
						{profile.bio}
						{isHidden('bio') && <OnlyYouMarker className="ml-1.5 size-3.5 align-[-0.125em]" />}
					</p>
				)}
				{onOpenList && !!profile.mutualFollowersCount && (
					<button
						type="button"
						onClick={() => onOpenList('mutual')}
						className={cn(detailLink, 'mt-2.5 block text-left text-[12px] text-muted-foreground')}
					>
						{mutualText(profile.mutualFollowersCount, profile.mutualFollowersPreview ?? [])}
					</button>
				)}
				{/* Items set apart by space and kept whole when they wrap */}
				<div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
					{before.map(detail)}
					{onOpenList && [listLink('followers', profile.followersCount), listLink('following', profile.followingCount)]}
					{after.map(detail)}
				</div>
			</div>
			{/* Wraps under the details on phones */}
			<div className="flex gap-2 empty:hidden">{actions}</div>
		</header>
	);
}

/** Marks a detail only the owner can see: a lock, named for screen readers. */
export function OnlyYouMarker({ className }: { className?: string }) {
	const { t } = useLanguage();
	return (
		<>
			<Lock aria-hidden className={cn('inline shrink-0 text-muted-foreground', className)} />
			<span className="sr-only">({t('profile.onlyYou')})</span>
		</>
	);
}
