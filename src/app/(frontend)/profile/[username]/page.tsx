import { getUserSession } from '@/data/auth';
import { getPollsByCreator } from '@/lib/api/services/polls';
import { getUserProfile } from '@/lib/api/services/users';

import ProfileHeader from './_components/ProfileHeader';
import ProfilePollList from './_components/ProfilePollList';

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	const [profile, polls, session] = await Promise.all([
		getUserProfile(username),
		getPollsByCreator(username),
		getUserSession(),
	]);

	if (!profile) {
		return (
			<div className="px-contain max-w-2xl mx-auto py-10">
				<p className="text-muted-foreground">User not found.</p>
			</div>
		);
	}

	const isOwner = session?.sub === username;
	const isAuthenticated = !!session;

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
