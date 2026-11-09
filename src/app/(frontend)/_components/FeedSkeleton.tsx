import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export function FeedSkeleton() {
	return (
		// pt-6 puts the first card where the feed's first row lands, level with HomeRail's first card
		<div className="w-full max-w-feed pt-6 pb-4">
			<PollListSkeleton />
		</div>
	);
}
