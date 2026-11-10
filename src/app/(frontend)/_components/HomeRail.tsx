import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

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
		// Its first card lines up with the first row below the pill bar (a card, or a topic's Follow button), or for guests
		// with the login prompt. Sticks where it rests, like the pill bar. Scrolls itself when taller than the window, so AskCard stays reachable
		<aside
			className={cn(
				'flex w-full max-w-feed flex-col gap-4 xl:sticky xl:top-0 xl:max-h-dvh xl:overflow-y-auto xl:pb-2',
				signedIn ? 'xl:pt-[calc(var(--feed-bar-height)+0.5rem)]' : 'xl:pt-6'
			)}
		>
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
