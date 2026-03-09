import { mockPolls } from '@/app/api/get-polls/mockData';
import { getUserSession } from '@/data/auth';
import { Poll } from '@/types/poll';
import { UserProfile } from '@/types/user';

import ProfileHeader from './_components/ProfileHeader';
import ProfilePollList from './_components/ProfilePollList';

async function getUserProfile(username: string): Promise<UserProfile> {
	try {
		const url = `${process.env.API_URL}/api/v1/users/${encodeURIComponent(username)}`;
		const res = await fetch(url, { next: { revalidate: 60 } });
		const resData = await res.json();
		if (resData?.success) return resData.data;
	} catch {
		// fall through to mock
	}
	const userPolls = mockPolls.filter((p) => p.creatorUsername === username);
	return {
		username,
		displayName: null,
		bio: null,
		joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
		totalPolls: userPolls.length,
		totalVotes: userPolls.reduce((sum, p) => sum + p.totalVotes, 0),
	};
}

async function getUserPolls(username: string): Promise<Poll[]> {
	try {
		const url = `${process.env.API_URL}/api/v1/votes?creatorUsername=${encodeURIComponent(username)}`;
		const res = await fetch(url, { next: { revalidate: 60 } });
		const resData = await res.json();
		if (resData?.success) return resData.data?.content ?? [];
	} catch {
		// fall through to mock
	}
	return mockPolls.filter((p) => p.creatorUsername === username);
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
