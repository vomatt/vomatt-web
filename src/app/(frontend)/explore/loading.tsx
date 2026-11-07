import { PageShell } from '@/components/layout/PageShell';

import { ExploreSkeleton } from './_components/ExploreView';

export default function Loading() {
	return (
		<PageShell wide>
			<ExploreSkeleton />
		</PageShell>
	);
}
