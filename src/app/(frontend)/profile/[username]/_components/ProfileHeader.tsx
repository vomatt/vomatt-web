import { format } from 'date-fns';
import { User } from '@/components/ui/SvgIcons';

import { Card, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { UserProfile } from '@/types/user';

import EditProfileSheet from './EditProfileSheet';

interface ProfileHeaderProps {
	profile: UserProfile;
	isOwner: boolean;
}

export default function ProfileHeader({
	profile,
	isOwner,
}: ProfileHeaderProps) {
	const joinedDate = profile.joinedAt
		? format(new Date(profile.joinedAt), 'MMM yyyy')
		: null;

	return (
		<Card>
			<CardContent className="flex flex-col gap-4">
				{/* Avatar + identity row */}
				<div className="flex items-center gap-4">
					<div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center shrink-0">
						<User className="w-8 h-8 text-white" />
					</div>
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
				<div className="flex gap-6 text-sm">
					<div className="flex flex-col items-center">
						<span className="font-semibold text-foreground">
							{profile.totalPolls}
						</span>
						<span className="text-muted-foreground text-xs">Polls</span>
					</div>
					<div className="flex flex-col items-center">
						<span className="font-semibold text-foreground">
							{profile.totalVotes}
						</span>
						<span className="text-muted-foreground text-xs">Votes</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
