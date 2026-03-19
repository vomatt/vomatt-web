import { ApiError, publicFetch } from '@/lib/api/client';
import { getUserSession } from '@/data/auth';
import { Poll } from '@/types/poll';
import { UserProfile } from '@/types/user';

import ProfileHeader from './_components/ProfileHeader';
import ProfilePollList from './_components/ProfilePollList';

async function getUserProfile(username: string): Promise<UserProfile | null> {
	try {
		return await publicFetch<UserProfile>(
			`${process.env.API_URL}/api/v1/users/${encodeURIComponent(username)}`,
			{ next: { revalidate: 60 } } as RequestInit
		);
	} catch (error) {
		if (error instanceof ApiError && error.statusCode === 404) return null;
		throw error;
	}
}

async function getUserPolls(username: string): Promise<Poll[]> {
	try {
		const page = await publicFetch<{ content: Poll[] }>(
			`${process.env.API_URL}/api/v1/votes?creatorUsername=${encodeURIComponent(username)}`,
			{ next: { revalidate: 60 } } as RequestInit
		);
		return page?.content ?? [];
	} catch {
		return [];
	}
}

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username } = await params;

	const [profile, polls, session] = await Promise.all([
		getUserProfile(username),
		getUserPolls(username),
		getUserSession(),
	]);

	if (!profile) {
		return (
			<div className="px-contain max-w-2xl mx-auto py-10">
				<p className="text-muted-foreground">User not found.</p>
			</div>
		);
	}

	const isOwner = session?.username === username || session?.nickName === username;

	return (
		<div className="px-contain max-w-2xl mx-auto py-6 space-y-6">
			<ProfileHeader profile={profile} isOwner={isOwner} />
			<div>
				<h2 className="text-lg font-semibold mb-4">Polls</h2>
				<ProfilePollList polls={polls} />
			</div>
		</div>
	);
}
