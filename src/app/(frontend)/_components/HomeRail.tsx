import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';

import { AskCard } from './AskCard';
import { HowCountsCard } from './HowCountsCard';
import { RailPolls } from './RailPolls';

/**
 * The PageShell rail beside the feed from xl up, below it on phones: the Poll side
 * cards and an invitation to ask for signed-in viewers, how vomatt counts for guests.
 */
export function HomeRail({ signedIn }: { signedIn: boolean }) {
	return (
		<aside className="flex w-full max-w-feed flex-col gap-4 xl:sticky xl:top-[calc(var(--header-height)+1rem)] xl:pt-6">
			{signedIn ? (
				<>
					{/* Holds a side card's place so AskCard doesn't drop when the cards stream in */}
					<Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
						<RailPolls />
					</Suspense>
					<AskCard />
				</>
			) : (
				<HowCountsCard />
			)}
		</aside>
	);
}
