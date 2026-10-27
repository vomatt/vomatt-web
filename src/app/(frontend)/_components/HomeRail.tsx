import { Suspense } from 'react';

import { AskCard } from './AskCard';
import { HowCountsCard } from './HowCountsCard';
import { RailPolls } from './RailPolls';

/**
 * The column beside the feed from xl up (260–320px), below it on phones: the Poll side
 * cards and an invitation to ask for signed-in viewers, how vomatt counts for guests.
 */
export function HomeRail({ signedIn }: { signedIn: boolean }) {
	return (
		<aside className="flex w-full max-w-feed flex-col gap-4 xl:sticky xl:top-[calc(var(--header-height)+1rem)] xl:max-w-[320px] xl:flex-[1_1_260px] xl:pt-6">
			{signedIn ? (
				<>
					<Suspense fallback={null}>
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
