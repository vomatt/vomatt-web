import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';

/** Below the feeds' pill bar, where the first card will land. Level with HomeRail's. */
export function FeedSkeleton() {
	return (
		<div className="w-full max-w-feed pt-2 pb-4">
			<PollListSkeleton />
		</div>
	);
}
