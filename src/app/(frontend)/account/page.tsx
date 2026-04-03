import { getUserSession } from '@/data/auth';
import defineMetadata from '@/lib/defineMetadata';
import { getPollsByCreator } from '@/lib/api/services/polls';
import { Poll } from '@/types/poll';
import { UserProfile } from '@/types/user';

import AccountPage from './_components/AccountPage';

export async function generateMetadata({}) {
	return defineMetadata({ data: {} });
}

export default async function Page() {
	const session = await getUserSession();
	const username: string = session?.username ?? session?.nickName ?? '';

	const polls = username ? await getPollsByCreator(username) : [];

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
