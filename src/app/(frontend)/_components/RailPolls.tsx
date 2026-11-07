import { cache } from 'react';

import { PollSideCard } from '@/features/polls/components/PollSideCard';
import type { FeedKind } from '@/features/polls/feeds';
import { loadFeed } from '@/features/polls/service';

const RAIL_SIZE = 3;

/** A feed's first page, cached per request, so a feed's page and the rail share one read. */
export const getFirstPage = cache((feed: FeedKind) => loadFeed(feed, null));

/**
 * The first few of the Results are in and Closing soon feeds, and whether a result is unread.
 * A list that fails comes back empty. Cached per request, so the rail and the pills share it.
 */
export const getRailPolls = cache(async () => {
	const [resultsIn, closingSoon] = await Promise.all([
		getFirstPage('resultsIn').catch(() => null),
		getFirstPage('closingSoon').catch(() => null),
	]);
	const results = resultsIn?.items ?? [];
	return {
		resultsIn: results.slice(0, RAIL_SIZE),
		closingSoon: (closingSoon?.items ?? []).slice(0, RAIL_SIZE),
		resultsUnread: results.some((poll) => poll.unread),
	};
});

/** The side cards for the rail. An empty list is left out. */
export async function RailPolls() {
	const { resultsIn, closingSoon } = await getRailPolls();

	return (
		<>
			{resultsIn.length > 0 && <PollSideCard kind="resultsIn" polls={resultsIn} />}
			{closingSoon.length > 0 && <PollSideCard kind="closingSoon" polls={closingSoon} />}
		</>
	);
}
