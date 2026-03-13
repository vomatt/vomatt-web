'use client';

import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { logout } from '@/lib/api/auth';
import { UserProfile } from '@/types/user';

import ProfileHeader from '../../profile/[username]/_components/ProfileHeader';
import ProfilePollList from '../../profile/[username]/_components/ProfilePollList';
import { Poll } from '@/types/poll';

export type AccountPageProps = {
	profile: UserProfile;
	polls: Poll[];
};

export default function AccountPage({ profile, polls }: AccountPageProps) {
	return (
		<div className="px-contain max-w-2xl mx-auto py-6 space-y-6">
			<ProfileHeader profile={profile} isOwner={true} />
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
