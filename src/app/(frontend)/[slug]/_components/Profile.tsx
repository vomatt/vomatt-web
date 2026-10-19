import { Skeleton } from '@/components/ui/Skeleton';
import { ballotHistory, computeInsights } from '@/features/account/insights';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { Poll } from '@/features/polls/schema';
import { getAllMyPolls } from '@/features/polls/service';
import type { CursorPage } from '@/lib/api/cursor';
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

/** The signed-in user's own profile: the public page plus insights, Groups and Settings. */
export async function OwnProfile({ profile }: { profile: MyProfile }) {
	// Every Poll the user created or holds a Ballot in, so insights cover them all
	const [open, ended] = await Promise.all([
		getAllMyPolls('open').catch(() => []),
		getAllMyPolls('ended').catch(() => []),
	]);
	const all = [...open, ...ended];
	const myPolls = all.filter((poll) => poll.creatorId === profile.id);
	const insights = computeInsights(myPolls, ballotHistory(all));
	// The same list visitors get from /users/{username}/votes, most recently opened first, already in hand
	const polls: CursorPage<Poll> = {
		items: [...myPolls].sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime)),
		nextCursor: null,
	};

	return <AccountPage isOwn profile={profile} polls={polls} insights={insights} />;
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
				<PollRowListSkeleton />
			</div>
		</div>
	);
}
