import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export function FeedSkeleton() {
	return (
		<div className="w-full max-w-feed py-4">
			<PollListSkeleton />
		</div>
	);
}
