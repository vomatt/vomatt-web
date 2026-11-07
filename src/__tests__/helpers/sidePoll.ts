import type { Poll } from '@/features/polls/schema';

const HOUR = 3600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

/** An Open Poll ending in a little over two hours, for the side cards and their pills. */
export const sidePoll: Poll = {
	id: 'poll-1',
	title: 'Bike lane on Mill Road?',
	active: true,
	votingActive: true,
	creatorId: 'user-1',
	creatorUsername: 'mei.lin',
	createdAt: iso(-48 * HOUR),
	startTime: iso(-48 * HOUR),
	endTime: iso(2 * HOUR + 60_000),
	participantCount: 1502,
	options: [],
};
