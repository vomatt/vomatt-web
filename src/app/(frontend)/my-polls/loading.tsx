import { Skeleton } from '@/components/ui/Skeleton';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export default function Loading() {
	return (
		<div className="px-contain mx-auto max-w-2xl py-6">
			<Skeleton className="mb-6 h-10 w-44" />
			<Skeleton className="mb-4 h-9 w-56 rounded-lg" />
			<PollListSkeleton />
		</div>
	);
}
