import { PageShell } from '@/components/layout/PageShell';

import { ExploreSkeleton } from './_components/ExploreView';

export default function Loading() {
	return (
		<PageShell wide className="pt-2 md:pt-8">
			<ExploreSkeleton />
		</PageShell>
	);
}
