'use client';

import { useState } from 'react';
import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { UserProfile } from '@/types/user';

import AvatarUploader from './AvatarUploader';
import EditProfileSheet from './EditProfileSheet';
import FollowButton from './FollowButton';
import FollowersSheet from './FollowersSheet';

interface ProfileHeaderProps {
	profile: UserProfile;
	isOwner: boolean;
	isAuthenticated: boolean;
}

export default function ProfileHeader({
	profile,
	isOwner,
	isAuthenticated,
}: ProfileHeaderProps) {
	const [followersSheetType, setFollowersSheetType] = useState<
		'followers' | 'following' | null
	>(null);

	const joinedDate = profile.joinedAt
		? format(new Date(profile.joinedAt), 'MMM yyyy')
		: null;

	return (
		<>
			<Card>
				<CardContent className="flex flex-col gap-4">
					{/* Avatar + identity */}
					<div className="flex items-center gap-4">
						<AvatarUploader
							initialAvatarUrl={profile.avatarUrl}
							isOwner={isOwner}
						/>
						<div className="flex-1 min-w-0">
							<h1 className="text-xl font-bold text-foreground truncate">
								{profile.displayName ?? profile.username}
							</h1>
							{profile.displayName && (
								<p className="text-sm text-muted-foreground">
									@{profile.username}
								</p>
							)}
							{joinedDate && (
								<p className="text-xs text-muted-foreground mt-0.5">
									Joined {joinedDate}
								</p>
							)}
						</div>
						{isOwner && (
							<EditProfileSheet
								initialDisplayName={profile.displayName ?? ''}
								initialBio={profile.bio ?? ''}
								initialAvatarUrl={profile.avatarUrl}
							/>
						)}
					</div>

					{/* Bio */}
					{profile.bio && (
						<p className="text-sm text-foreground leading-relaxed">
							{profile.bio}
						</p>
					)}

					<Separator />

					{/* Stats strip */}
					<div className="flex flex-wrap items-center gap-6 text-sm">
						<div className="flex flex-col items-center">
							<span className="font-semibold text-foreground">{profile.totalPolls}</span>
							<span className="text-muted-foreground text-xs">Polls</span>
						</div>
						<div className="flex flex-col items-center">
							<span className="font-semibold text-foreground">{profile.totalVotes}</span>
							<span className="text-muted-foreground text-xs">Votes</span>
						</div>

						{/* FollowButton owns followers count + follow toggle */}
						{!isOwner && isAuthenticated ? (
							<FollowButton
								username={profile.username}
								initialIsFollowing={profile.isFollowing ?? false}
								initialFollowersCount={profile.followersCount}
								onOpenFollowers={() => setFollowersSheetType('followers')}
							/>
						) : (
							<button
								type="button"
								onClick={() => setFollowersSheetType('followers')}
								className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
							>
								<span className="font-semibold text-foreground">{profile.followersCount}</span>
								<span className="text-muted-foreground text-xs">Followers</span>
							</button>
						)}

						<button
							type="button"
							onClick={() => setFollowersSheetType('following')}
							className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
						>
							<span className="font-semibold text-foreground">{profile.followingCount}</span>
							<span className="text-muted-foreground text-xs">Following</span>
						</button>
					</div>
				</CardContent>
			</Card>

			<FollowersSheet
				username={profile.username}
				type={followersSheetType ?? 'followers'}
				open={followersSheetType !== null}
				onOpenChange={(open) => {
					if (!open) setFollowersSheetType(null);
				}}
			/>
		</>
	);
}
