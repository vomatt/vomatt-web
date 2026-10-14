import { Skeleton } from '@/components/ui/Skeleton';
import { ballotHistory, computeInsights } from '@/features/account/insights';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { Poll } from '@/features/polls/schema';
import { getAllMyPolls } from '@/features/polls/service';
import type { CursorPage } from '@/lib/api/cursor';
import { getUserProfile } from '@/lib/api/services/users';
import type { MyProfile, UserProfile } from '@/types/user';

import AccountPage from './AccountPage';

/** Someone else's profile: the account page minus what its owner keeps private. */
export async function PublicProfile({
	profile,
	polls: pollsPromise,
	isAuthenticated,
}: {
	profile: UserProfile;
	polls: Promise<CursorPage<Poll>>;
	isAuthenticated: boolean;
}) {
	const polls = await pollsPromise;

	return <AccountPage isOwn={false} profile={profile} polls={polls} isAuthenticated={isAuthenticated} />;
}

/** The signed-in user's own profile: their account page. */
export async function OwnProfile({ profile }: { profile: MyProfile }) {
	// Every Poll the user created or holds a Ballot in, so insights cover them all
	// The public profile is read too: avatars may ship there before /users/me carries them
	const [open, ended, publicProfile] = await Promise.all([
		getAllMyPolls('open').catch(() => []),
		getAllMyPolls('ended').catch(() => []),
		getUserProfile(profile.username).catch(() => null),
	]);
	const polls = [...open, ...ended];
	const myPolls = polls.filter((poll) => poll.creatorId === profile.id);
	const history = ballotHistory(polls);
	const insights = computeInsights(myPolls, history);

	const avatarUrl = profile.avatarUrl !== undefined ? profile.avatarUrl : publicProfile?.avatarUrl;

	return <AccountPage isOwn profile={{ ...profile, avatarUrl }} myPolls={myPolls} history={history} insights={insights} />;
}

export function ProfileSkeleton() {
	return (
		<div className="px-contain mx-auto max-w-3xl space-y-8 py-6 md:py-10">
			<div className="flex items-center gap-4">
				<Skeleton className="size-16 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-3.5 w-24" />
				</div>
			</div>
			<Skeleton className="h-20 rounded-xl" />
			<div>
				<Skeleton className="mb-4 h-8 w-40" />
				<PollListSkeleton />
			</div>
		</div>
	);
}
