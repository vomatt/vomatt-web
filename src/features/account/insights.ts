import type { Poll } from '@/features/polls/schema';
import { getWinners, isRevealed } from '@/features/polls/status';

export type BallotOutcome = 'pending' | 'won' | 'tied' | 'lost' | 'unknown';

/** Whether the viewer's pick won an Ended Poll; `pending` until its results are revealed. */
export function ballotOutcome(poll: Poll, optionId: string, now = Date.now()): BallotOutcome {
	if (!isRevealed(poll, now)) return 'pending';
	if (poll.options.some((option) => option.votes === undefined)) return 'unknown';
	const winners = getWinners(poll.options.map((option) => ({ id: option.id, votes: option.votes ?? 0 })));
	if (!winners.some((option) => option.id === optionId)) return 'lost';
	return winners.length > 1 ? 'tied' : 'won';
}

/** The text of the option the viewer picked; empty when it is gone. */
export function ballotChoice(poll: Poll): string {
	return poll.options.find((option) => option.id === poll.myOptionId)?.text ?? '';
}
