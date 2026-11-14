import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { Skeleton } from '@/components/ui/Skeleton';

// Without it, the Notifications list's skeleton would stand in for this page
export default function Loading() {
	return (
		<PageShell>
			<div role="status" aria-busy className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 sm:px-8">
				<span className="sr-only">
					<T k="common.loading" />
				</span>
				<Skeleton className="size-14 rounded-full" />
				<Skeleton className="h-8 w-64 max-w-full" />
				<Skeleton className="h-16 w-full max-w-[420px] rounded-xl" />
				<Skeleton className="mt-2 h-11 w-48" />
			</div>
		</PageShell>
	);
}
