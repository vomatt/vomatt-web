import { PollSideCard } from '@/features/polls/components/PollSideCard';
import { getMyPolls, getPolls } from '@/features/polls/service';
import { derivePollStatus } from '@/features/polls/status';

const RAIL_SIZE = 3;

/**
 * Ended Polls the viewer voted in, and Open ones ending within a day.
 * A list that fails or comes back empty is left out.
 */
export async function RailPolls({ signedIn }: { signedIn: boolean }) {
	const [ended, open] = await Promise.all([
		signedIn ? getMyPolls('ended', null, 10).catch(() => null) : null,
		getPolls({ sort: 'closing' }, null, 10).catch(() => null),
	]);
	const resultsIn = (ended?.items ?? []).filter((poll) => !!poll.myOptionId).slice(0, RAIL_SIZE);
	const closingSoon = (open?.items ?? [])
		.filter((poll) => derivePollStatus(poll) === 'closing')
		.slice(0, RAIL_SIZE);

	return (
		<>
			{resultsIn.length > 0 && <PollSideCard kind="resultsIn" polls={resultsIn} />}
			{closingSoon.length > 0 && <PollSideCard kind="closingSoon" polls={closingSoon} />}
		</>
	);
}
