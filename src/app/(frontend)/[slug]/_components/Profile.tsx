import { Skeleton } from '@/components/ui/Skeleton';
import { PollRowListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import type { Poll } from '@/features/polls/schema';
import { getAllMyPolls } from '@/features/polls/service';
import type { CursorPage } from '@/lib/api/cursor';
import type { MyProfile, UserProfile } from '@/types/user';

import { OwnProfileView, type ProfileTab } from './OwnProfileView';
import { VisitorProfileView } from './VisitorProfileView';

/** Someone else's profile, or the owner previewing theirs (`preview`). */
export async function PublicProfile({
	profile,
	polls: pollsPromise,
	isAuthenticated,
	preview,
}: {
	profile: UserProfile;
	/** Resolves to null when the polls couldn't load */
	polls: Promise<CursorPage<Poll> | null>;
	isAuthenticated: boolean;
	preview?: boolean;
}) {
	const polls = await pollsPromise;
	return <VisitorProfileView profile={profile} polls={polls} isAuthenticated={isAuthenticated} preview={preview} />;
}

/** The signed-in user's own profile: their Asked and Voted lists come from every page of My Polls. */
export async function OwnProfile({
	profile,
	initialTab,
	openEdit,
}: {
	profile: MyProfile;
	initialTab?: ProfileTab;
	openEdit?: boolean;
}) {
	const polls = await Promise.all([getAllMyPolls('open'), getAllMyPolls('ended')]).then(
		(pages) => pages.flat(),
		// Not an empty list: the page says it couldn't load
		() => null
	);
	return <OwnProfileView profile={profile} polls={polls} initialTab={initialTab} openEdit={openEdit} />;
}

export function ProfileSkeleton() {
	return (
		<div className="px-contain mx-auto max-w-[1080px] space-y-6 py-6 md:py-10">
			<div className="flex max-w-[720px] items-start gap-5">
				<Skeleton className="size-18 rounded-full md:size-22" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-3.5 w-24" />
					<Skeleton className="h-3.5 w-64" />
				</div>
			</div>
			<Skeleton className="h-[86px] max-w-[720px] rounded-2xl" />
			<div className="max-w-[720px]">
				<Skeleton className="mb-4 h-11 w-48" />
				<PollRowListSkeleton />
			</div>
		</div>
	);
}
