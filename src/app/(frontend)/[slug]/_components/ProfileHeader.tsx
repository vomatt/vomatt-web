'use client';

import { format } from 'date-fns';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { User } from '@/components/ui/SvgIcons';
import { UserProfile } from '@/types/user';

import FollowButton from './FollowButton';
import FollowersSheet from './FollowersSheet';

interface ProfileHeaderProps {
	profile: UserProfile;
	isAuthenticated: boolean;
}

export default function ProfileHeader({
	profile,
	isAuthenticated,
}: ProfileHeaderProps) {
	const [followersSheetType, setFollowersSheetType] = useState<
		'followers' | 'following' | null
	>(null);

	// The backend sends these only once it supports follows
	const followersCount = profile.followersCount;
	const followingCount = profile.followingCount;

	const joinedDate = profile.joinedAt
		? format(new Date(profile.joinedAt), 'MMM yyyy')
		: null;

	return (
		<>
			<Card>
				<CardContent className="flex flex-col gap-4">
					{/* Avatar + identity */}
					<div className="flex items-center gap-4">
						<div className="size-16 shrink-0 overflow-hidden rounded-full bg-primary flex items-center justify-center text-white">
							{profile.avatarUrl ? (
								<img src={profile.avatarUrl} alt="" className="size-full object-cover" />
							) : (
								<User size="2em" />
							)}
						</div>
						<div className="flex-1 min-w-0">
							<h1 className="truncate display-heading text-[28px] text-foreground">
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
						{followersCount !== undefined &&
							(isAuthenticated ? (
								<FollowButton
									username={profile.username}
									initialIsFollowing={profile.isFollowing ?? false}
									initialFollowersCount={followersCount}
									onOpenFollowers={() => setFollowersSheetType('followers')}
								/>
							) : (
								<button
									type="button"
									onClick={() => setFollowersSheetType('followers')}
									className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
								>
									<span className="font-semibold text-foreground">{followersCount}</span>
									<span className="text-muted-foreground text-xs">Followers</span>
								</button>
							))}

						{followingCount !== undefined && (
							<button
								type="button"
								onClick={() => setFollowersSheetType('following')}
								className="flex flex-col items-center cursor-pointer hover:opacity-70 transition-opacity"
							>
								<span className="font-semibold text-foreground">{followingCount}</span>
								<span className="text-muted-foreground text-xs">Following</span>
							</button>
						)}
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
