import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { PollListSkeleton } from '@/features/polls/components/PollCardSkeleton';
import { EXPLORE_PAGE_SIZE } from '@/features/polls/constants';
import { getPolls, getPopularTags } from '@/features/polls/service';

import { ExploreView } from './_components/ExploreView';

export default async function ExplorePage() {
	return (
		<div className="px-contain mx-auto max-w-2xl py-6">
			<Suspense fallback={<ExploreSkeleton />}>
				<ExploreContent />
			</Suspense>
		</div>
	);
}

async function ExploreContent() {
	const [firstPage, tags] = await Promise.all([
		getPolls({ status: 'open' }, null, EXPLORE_PAGE_SIZE).catch(() => null),
		getPopularTags(30),
	]);
	return <ExploreView initialPage={firstPage} tags={tags} />;
}

function ExploreSkeleton() {
	return (
		<div className="space-y-8">
			<Skeleton className="h-10 w-40" />
			<div className="flex flex-wrap gap-2">
				{Array.from({ length: 8 }, (_, i) => (
					<Skeleton key={i} className="h-9 w-24 rounded-xl" />
				))}
			</div>
			<PollListSkeleton />
		</div>
	);
}
