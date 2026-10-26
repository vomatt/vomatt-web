import { ballotOutcome } from '@/features/account/insights';
import type { Poll } from '@/features/polls/schema';
import { derivePollStatus, getWinners, isCancelled } from '@/features/polls/status';

/** Asked: Scheduled and Open polls first (what happens next), then Ended ones. */
export function splitAsked(polls: Poll[], now = Date.now()) {
	const open: Poll[] = [];
	const ended: Poll[] = [];
	for (const poll of polls) (derivePollStatus(poll, now) === 'ended' ? ended : open).push(poll);
	return { open, ended };
}

/** Voted: Sealed ballots waiting for results first, then decided ones. */
export function splitVoted(polls: Poll[], now = Date.now()) {
	const sealed: Poll[] = [];
	const decided: Poll[] = [];
	for (const poll of polls) (derivePollStatus(poll, now) === 'ended' ? decided : sealed).push(poll);
	return { sealed, decided };
}

/** The owner's Polls they voted in but didn't ask, from My Polls (which mixes both). */
export const votedPolls = (polls: Poll[], viewerId: string) =>
	polls.filter((poll) => poll.creatorId !== viewerId && !!poll.myOptionId);

/** The owner's own Polls, most recently opened first. */
export const askedPolls = (polls: Poll[], viewerId: string) =>
	polls
		.filter((poll) => poll.creatorId === viewerId)
		.sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));

/**
 * Share of decided ballots whose pick won outright, 0–100; null before any is decided.
 * Ties and unknown results count as decided only when known: a tie isn't a win.
 */
export function picksWonRate(polls: Poll[], now = Date.now()): number | null {
	let decided = 0;
	let won = 0;
	for (const poll of polls) {
		if (!poll.myOptionId || isCancelled(poll)) continue;
		const outcome = ballotOutcome(poll, poll.myOptionId, now);
		if (outcome === 'pending' || outcome === 'unknown') continue;
		decided++;
		if (outcome === 'won') won++;
	}
	return decided === 0 ? null : Math.round((won / decided) * 100);
}

export type EndedSummary =
	| { kind: 'won'; winner: string }
	| { kind: 'tie'; winners: string[] }
	| { kind: 'none' };

/** What an Ended Poll decided: one winner, a tie, or nothing to say (no votes, cancelled, counts hidden). */
export function endedSummary(poll: Poll): EndedSummary {
	if (isCancelled(poll) || poll.options.some((option) => option.votes === undefined)) return { kind: 'none' };
	const winners = getWinners(poll.options.map((option) => ({ text: option.text, votes: option.votes ?? 0 })));
	if (winners.length === 1) return { kind: 'won', winner: winners[0].text };
	if (winners.length > 1) return { kind: 'tie', winners: winners.map((option) => option.text) };
	return { kind: 'none' };
}
