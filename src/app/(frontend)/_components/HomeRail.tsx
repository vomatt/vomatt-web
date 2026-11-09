import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';

import { AskCard } from './AskCard';
import { HowCountsCard } from './HowCountsCard';
import { RailPolls } from './RailPolls';

/**
 * The PageShell rail beside the feed from xl up, below it on phones: the Poll side
 * cards (from xl; below it HomepageHeader's pills link to their feeds) and an invitation to ask for
 * signed-in viewers, how vomatt counts for guests.
 */
export function HomeRail({ signedIn }: { signedIn: boolean }) {
	return (
		// Mirrors the feed's pt-4 and the pill bar's py-2, so the first card lines up with the feed's first row at rest
		// and with the stuck pills once scrolled. Scrolls itself when taller than the window, so AskCard stays reachable
		<aside className="flex w-full max-w-feed flex-col gap-4 xl:sticky xl:top-0 xl:mt-4 xl:max-h-dvh xl:overflow-y-auto xl:py-2">
			{signedIn ? (
				<>
					<div className="hidden xl:contents">
						{/* Holds a side card's place so AskCard doesn't drop when the cards stream in */}
						<Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
							<RailPolls />
						</Suspense>
					</div>
					<AskCard />
				</>
			) : (
				<HowCountsCard />
			)}
		</aside>
	);
}
