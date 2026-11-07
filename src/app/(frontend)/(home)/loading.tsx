import { PageShell } from '@/components/layout/PageShell';

import { FeedSkeleton } from '../_components/FeedSkeleton';

export default function Loading() {
	return (
		<PageShell className="pt-0">
			<FeedSkeleton />
		</PageShell>
	);
}
