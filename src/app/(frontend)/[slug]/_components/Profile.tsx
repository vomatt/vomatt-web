import { PageShell } from '@/components/layout/PageShell';
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
	viewerId,
	preview,
}: {
	profile: UserProfile;
	/** Resolves to null when the polls couldn't load */
	polls: Promise<CursorPage<Poll> | null>;
	/** The signed-in viewer; null when signed out. */
	viewerId: string | null;
	preview?: boolean;
}) {
	const polls = await pollsPromise;
	return <VisitorProfileView profile={profile} polls={polls} viewerId={viewerId} preview={preview} />;
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

/** `rail={false}` for the owner's public preview, which has no rail. */
export function ProfileSkeleton({ rail = true }: { rail?: boolean }) {
	return (
		<PageShell rail={rail && <Skeleton className="h-28 rounded-2xl" />}>
			<div className="space-y-6">
				<div className="flex items-start gap-5">
					<Skeleton className="size-18 rounded-full md:size-22" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-3.5 w-24" />
						<Skeleton className="h-3.5 w-64" />
					</div>
				</div>
				<Skeleton className="h-[86px] rounded-2xl" />
				<div>
					<Skeleton className="mb-4 h-11 w-48" />
					<PollRowListSkeleton />
				</div>
			</div>
		</PageShell>
	);
}
