import { Skeleton } from '@/components/ui/Skeleton';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';

export default function Loading() {
	return (
		<div className="px-contain mx-auto max-w-2xl space-y-6 py-6">
			<div className="rounded-xl border border-border bg-card p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="size-16 rounded-full" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-40" />
						<Skeleton className="h-3.5 w-24" />
					</div>
				</div>
			</div>
			<Skeleton className="h-6 w-16" />
			<PollListSkeleton />
		</div>
	);
}
