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
	mutuals,
}: {
	profile: HeaderProfile;
	/** Edit profile and Settings for the owner; Follow and ••• for a visitor. */
	actions?: ReactNode;
	isOwn?: boolean;
	/** Fields visitors don't see; only the owner's header passes them */
	hiddenFields?: readonly string[];
	/** Opens the followers or following list; signed in only, as the lists are. Without it the counts are plain text. */
	onOpenList?: (list: FollowList) => void;
	/** "Followed by …" under the details, on a visitor's header. */
	mutuals?: ReactNode;
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

	const listCount = (list: FollowList, count: number) => {
		const label = (
			<Count
				value={count}
				label={countText(t, list === 'followers' ? 'profile.followersCount' : 'profile.followingCount', count, currentLanguage)}
			/>
		);
		if (!onOpenList) return <span key={list}>{label}</span>;
		return (
			<button key={list} type="button" onClick={() => onOpenList(list)} className={detailLink}>
				{label}
			</button>
		);
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
				<p className="wrap-anywhere font-mono text-[14px] text-muted-foreground">@{profile.username}</p>
				{profile.bio && (
					// Capped measure (~68 characters); Geist's wide 0 makes `ch` overshoot, so the cap is in rem
					<p className="mt-2.5 max-w-[30rem] wrap-anywhere whitespace-pre-line text-[14px]">
						{profile.bio}
						{isHidden('bio') && <OnlyYouMarker className="ml-1.5 size-3.5 align-[-0.125em]" />}
					</p>
				)}
				{/* Items set apart by space and kept whole when they wrap */}
				<div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
					{before.map(detail)}
					{listCount('followers', profile.followersCount)}
					{listCount('following', profile.followingCount)}
					{after.map(detail)}
				</div>
				{mutuals && <div className="mt-2 empty:hidden">{mutuals}</div>}
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
