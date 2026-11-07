import { cache } from 'react';

import { PollSideCard, PollSideStrip } from '@/features/polls/components/PollSideCard';
import { getMyPolls, getPolls } from '@/features/polls/service';
import { derivePollStatus } from '@/features/polls/status';

const RAIL_SIZE = 3;

/**
 * Ended Polls the signed-in viewer voted in, and Open ones ending within a day. A list that
 * fails comes back empty. Cached per request, so the rail and the strip share one fetch.
 */
export const getRailPolls = cache(async () => {
	const [ended, open] = await Promise.all([
		getMyPolls('ended', null, 10).catch(() => null),
		getPolls({ sort: 'closing' }, null, 10).catch(() => null),
	]);
	return {
		resultsIn: (ended?.items ?? []).filter((poll) => !!poll.myOptionId).slice(0, RAIL_SIZE),
		closingSoon: (open?.items ?? []).filter((poll) => derivePollStatus(poll) === 'closing').slice(0, RAIL_SIZE),
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

/**
 * The side cards as a strip over the feed below xl, where HomeRail leaves them out. It renders
 * with the feed, so nothing shifts once the feed paints; call getRailPolls() early to fetch alongside it.
 */
export async function RailPollsStrip() {
	return (
		<div className="xl:hidden">
			<PollSideStrip {...await getRailPolls()} />
		</div>
	);
}
