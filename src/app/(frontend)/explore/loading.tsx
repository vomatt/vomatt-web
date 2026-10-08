import { Skeleton } from '@/components/ui/Skeleton';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export default function Loading() {
	return (
		<div className="px-contain mx-auto max-w-2xl space-y-8 py-6">
			<Skeleton className="h-10 w-40" />
			<div className="flex flex-wrap gap-2">
				{Array.from({ length: 8 }, (_, i) => (
					<Skeleton key={i} className="h-7 w-20 rounded-full" />
				))}
			</div>
			<PollListSkeleton />
		</div>
	);
}
