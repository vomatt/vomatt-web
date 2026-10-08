import { getMyProfile } from '@/data/auth';
import { getPollsByCreator } from '@/features/polls/service';
import { getUserProfile } from '@/lib/api/services/users';

import ProfileHeader from './_components/ProfileHeader';
import ProfilePollList from './_components/ProfilePollList';

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	const [profile, polls, me] = await Promise.all([
		getUserProfile(username),
		getPollsByCreator(username),
		getMyProfile(),
	]);

	if (!profile) {
		return (
			<div className="px-contain max-w-2xl mx-auto py-10">
				<p className="text-muted-foreground">User not found.</p>
			</div>
		);
	}

	// The session only carries the user id, so compare usernames via the profile
	const isOwner = me?.username === username;
	const isAuthenticated = !!me;

	return (
		<div className="px-contain max-w-2xl mx-auto py-6 space-y-6">
			<ProfileHeader
				profile={profile}
				isOwner={isOwner}
				isAuthenticated={isAuthenticated}
			/>
			<div>
				<h2 className="text-lg font-semibold mb-4">Polls</h2>
				<ProfilePollList polls={polls} />
			</div>
		</div>
	);
}
