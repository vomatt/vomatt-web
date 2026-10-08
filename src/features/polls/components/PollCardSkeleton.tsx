import { Skeleton } from '@/components/ui/Skeleton';

/** Placeholder with the PollCard's shape, shown while a page's data loads. */
export function PollCardSkeleton({ options = 3 }: { options?: number }) {
	return (
		<div aria-hidden className="rounded-xl border border-border bg-card">
			<div className="space-y-4 p-5">
				<div className="flex items-center justify-between">
					<Skeleton className="h-3.5 w-28" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-5 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
				<div className="space-y-1.5">
					{Array.from({ length: options }, (_, i) => (
						<Skeleton key={i} className="h-10 rounded-lg" />
					))}
				</div>
				<div className="flex items-center justify-between">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-8 w-16" />
				</div>
			</div>
		</div>
	);
}

export function PollListSkeleton() {
	return (
		<div role="status" aria-busy className="flex flex-col gap-3">
			{Array.from({ length: 3 }, (_, i) => (
				<PollCardSkeleton key={i} options={3 + (i % 2)} />
			))}
		</div>
	);
}
