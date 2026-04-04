'use client';

import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { logout } from '@/lib/api/auth';
import { MyProfile, UserProfile } from '@/types/user';

import ProfileHeader from '../../profile/[username]/_components/ProfileHeader';
import ProfilePollList from '../../profile/[username]/_components/ProfilePollList';
import { Poll } from '@/types/poll';

export type AccountPageProps = {
	profile: MyProfile;
	polls: Poll[];
};

function toUserProfile(my: MyProfile): UserProfile {
	return {
		username: my.username,
		displayName: my.displayName,
		bio: my.bio,
		joinedAt: my.joinedAt,
		totalPolls: my.totalPolls,
		totalVotes: my.totalVotes,
		avatarUrl: null,
		followersCount: 0,
		followingCount: 0,
	};
}

export default function AccountPage({ profile, polls }: AccountPageProps) {
	const userProfile = toUserProfile(profile);
	return (
		<div className="px-contain max-w-2xl mx-auto py-6 space-y-6">
			<ProfileHeader profile={{ ...userProfile, totalPolls: polls.length }} isOwner={true} isAuthenticated={true} />
			<div>
				<h2 className="text-lg font-semibold mb-4">My Polls</h2>
				<ProfilePollList polls={polls} />
			</div>
			<Separator />
			<div className="flex justify-end">
				<Button variant="destructive" onClick={() => logout()}>
					Log out
				</Button>
			</div>
		</div>
	);
}
