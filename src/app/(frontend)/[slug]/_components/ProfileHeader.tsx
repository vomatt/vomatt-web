'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { AvatarDialog } from '@/features/avatars/AvatarDialog';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { profileDetails } from '@/features/profiles/details';
import type { UserProfile } from '@/types/user';

import FollowButton from './FollowButton';
import FollowersSheet from './FollowersSheet';

type HeaderProfile = Pick<
	UserProfile,
	'username' | 'displayName' | 'bio' | 'joinedAt' | 'avatarUrl' | 'location' | 'points' | 'membershipLevel'
>;

/**
 * The same header for the owner and for visitors. Visitors get only the fields
 * the owner made public: the API sends hidden ones as null, so they drop out.
 * The owner's avatar opens the dialog to change it.
 */
export default function ProfileHeader({
	profile,
	action,
	isOwn = false,
}: {
	profile: HeaderProfile;
	action?: ReactNode;
	isOwn?: boolean;
}) {
	const { t, currentLanguage } = useLanguage();
	const name = profile.displayName || profile.username;

	const details = profileDetails(profile, t, currentLanguage);

	return (
		<header className="flex flex-wrap items-center gap-4">
			{isOwn ? (
				<AvatarDialog username={profile.username} avatarUrl={profile.avatarUrl} className="size-16" />
			) : (
				<UserAvatar username={profile.username} avatarUrl={profile.avatarUrl} className="size-16" tooltip />
			)}
			<div className="min-w-0 flex-1">
				<h1 className="truncate display-heading text-2xl md:text-[28px]">{name}</h1>
				{profile.displayName && <p className="mt-1 font-mono text-sm text-muted-foreground">@{profile.username}</p>}
				{profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
				<p className="mt-1 text-[13px] text-muted-foreground">{details.join(' · ')}</p>
			</div>
			{action}
		</header>
	);
}

/** Follow toggle and counts; renders nothing until the backend supports follows. */
export function FollowControls({ profile, isAuthenticated }: { profile: UserProfile; isAuthenticated: boolean }) {
	const { t } = useLanguage();
	const [sheetType, setSheetType] = useState<'followers' | 'following' | null>(null);
	const { followersCount, followingCount } = profile;
	if (followersCount === undefined && followingCount === undefined) return null;

	return (
		<div className="flex items-center gap-4 text-sm">
			{followersCount !== undefined &&
				(isAuthenticated ? (
					<FollowButton
						username={profile.username}
						initialIsFollowing={profile.isFollowing ?? false}
						initialFollowersCount={followersCount}
						onOpenFollowers={() => setSheetType('followers')}
					/>
				) : (
					<button
						type="button"
						onClick={() => setSheetType('followers')}
						className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
					>
						<span className="font-semibold text-foreground">{followersCount}</span>
						<span className="text-muted-foreground text-xs">{t('profile.followers')}</span>
					</button>
				))}
			{followingCount !== undefined && (
				<button
					type="button"
					onClick={() => setSheetType('following')}
					className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
				>
					<span className="font-semibold text-foreground">{followingCount}</span>
					<span className="text-muted-foreground text-xs">{t('profile.following')}</span>
				</button>
			)}
			<FollowersSheet
				username={profile.username}
				type={sheetType ?? 'followers'}
				open={sheetType !== null}
				onOpenChange={(open) => {
					if (!open) setSheetType(null);
				}}
			/>
		</div>
	);
}
