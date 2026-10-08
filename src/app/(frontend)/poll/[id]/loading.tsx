import { Skeleton } from '@/components/ui/Skeleton';
import { PollCardSkeleton } from '@/features/polls/components/PollCardSkeleton';

export default function Loading() {
	return (
		<div className="px-contain mx-auto max-w-5xl py-6">
			<Skeleton className="mb-4 h-8 w-20" />
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
				<PollCardSkeleton options={4} />
				<div className="space-y-5 rounded-xl border border-border bg-card p-5">
					<div className="flex items-center gap-3">
						<Skeleton className="size-9 rounded-full" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-3.5 w-full" />
					<Skeleton className="h-3.5 w-5/6" />
				</div>
			</div>
		</div>
	);
}
