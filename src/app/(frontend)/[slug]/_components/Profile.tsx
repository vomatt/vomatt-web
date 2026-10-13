import { Skeleton } from '@/components/ui/Skeleton';
import { ballotHistory, computeInsights } from '@/features/account/insights';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { Poll } from '@/features/polls/schema';
import { getMyPolls } from '@/features/polls/service';
import { type CursorPage, EMPTY_PAGE } from '@/lib/api/cursor';
import { getUserProfile } from '@/lib/api/services/users';
import type { MyProfile, UserProfile } from '@/types/user';

import AccountPage from './AccountPage';
import ProfileHeader from './ProfileHeader';
import ProfilePollList from './ProfilePollList';

/** Someone else's profile, as anyone may see it. */
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

	return (
		<div className="px-contain max-w-2xl mx-auto py-6 space-y-6">
			<ProfileHeader profile={profile} isAuthenticated={isAuthenticated} />
			<div>
				<h2 className="text-lg font-semibold mb-4">Polls</h2>
				<ProfilePollList username={profile.username} initialPage={polls} />
			</div>
		</div>
	);
}

/** The signed-in user's own profile: their account page. */
export async function OwnProfile({ profile }: { profile: MyProfile }) {
	// The latest 50 of each: Polls the user created or holds a Ballot in
	// The public profile is read too: avatars may ship there before /users/me carries them
	const [open, ended, publicProfile] = await Promise.all([
		getMyPolls('open').catch(() => EMPTY_PAGE),
		getMyPolls('ended').catch(() => EMPTY_PAGE),
		getUserProfile(profile.username).catch(() => null),
	]);
	const polls = [...open.items, ...ended.items];
	const myPolls = polls.filter((poll) => poll.creatorId === profile.id);
	const history = ballotHistory(polls);
	const insights = computeInsights(profile, myPolls, history);

	const avatarUrl = profile.avatarUrl !== undefined ? profile.avatarUrl : publicProfile?.avatarUrl;

	return <AccountPage profile={{ ...profile, avatarUrl }} myPolls={myPolls} history={history} insights={insights} />;
}

export function ProfileSkeleton() {
	return (
		<div className="px-contain max-w-2xl mx-auto py-6 space-y-6">
			<div className="rounded-xl border border-border bg-card p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="size-16 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-3.5 w-24" />
					</div>
				</div>
			</div>
			<div>
				<Skeleton className="mb-4 h-6 w-16" />
				<PollListSkeleton />
			</div>
		</div>
	);
}
