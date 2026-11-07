import { PageShell } from '@/components/layout/PageShell';
import { T } from '@/components/T';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
	return (
		<PageShell>
			<div role="status" aria-busy className="flex flex-col gap-3 pt-14 md:pt-0">
				<span className="sr-only">
					<T k="common.loading" />
				</span>
				<Skeleton className="mb-5 h-8 w-40" />
				{Array.from({ length: 4 }, (_, i) => (
					<Skeleton key={i} className="h-14 rounded-xl" />
				))}
			</div>
		</PageShell>
	);
}
