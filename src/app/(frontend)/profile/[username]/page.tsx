import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { getMyProfile } from '@/data/auth';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
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
	return (
		<div className="px-contain max-w-2xl mx-auto py-6 space-y-6">
			<Suspense fallback={<ProfileSkeleton />}>
				<Profile username={username} />
			</Suspense>
		</div>
	);
}

async function Profile({ username }: { username: string }) {
	const [profile, polls, me] = await Promise.all([
		getUserProfile(username),
		getPollsByCreator(username),
		getMyProfile(),
	]);

	if (!profile) {
		return <p className="py-4 text-muted-foreground">User not found.</p>;
	}

	// The session only carries the user id, so compare usernames via the profile
	const isOwner = me?.username === username;
	const isAuthenticated = !!me;

	return (
		<>
			<ProfileHeader
				profile={profile}
				isOwner={isOwner}
				isAuthenticated={isAuthenticated}
			/>
			<div>
				<h2 className="text-lg font-semibold mb-4">Polls</h2>
				<ProfilePollList polls={polls} />
			</div>
		</>
	);
}

function ProfileSkeleton() {
	return (
		<>
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
		</>
	);
}
