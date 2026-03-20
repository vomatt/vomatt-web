import { publicFetch } from '@/lib/api/client';
import { getUserSession } from '@/data/auth';
import defineMetadata from '@/lib/defineMetadata';
import { Poll } from '@/types/poll';
import { UserProfile } from '@/types/user';

import AccountPage from './_components/AccountPage';

export async function generateMetadata({}) {
	return defineMetadata({ data: {} });
}

async function getAccountPolls(username: string): Promise<Poll[]> {
	try {
		const url = `${process.env.API_URL}/api/v1/votes?creatorUsername=${encodeURIComponent(username)}`;
		const page = await publicFetch<{ content: Poll[] }>(
			url,
			{ next: { revalidate: 60 } } as RequestInit
		);
		return page?.content ?? [];
	} catch {
		return [];
	}
}

export default async function Page() {
	const session = await getUserSession();
	const username: string = session?.username ?? session?.nickName ?? '';

	const polls = username ? await getAccountPolls(username) : [];

	const profile: UserProfile = {
		username,
		displayName: session?.nickName ?? null,
		bio: session?.bio ?? null,
		joinedAt: session?.createdAt ?? new Date().toISOString(),
		totalPolls: polls.length,
		totalVotes: polls.reduce((sum: number, p: Poll) => sum + p.totalVotes, 0),
		avatarUrl: null,
		followersCount: 0,
		followingCount: 0,
	};

	return <AccountPage profile={profile} polls={polls} />;
}
