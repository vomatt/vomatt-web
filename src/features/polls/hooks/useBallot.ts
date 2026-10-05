'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useLanguage } from '@/contexts/LanguageContext';

import { type ActionResult, isPollEnded } from '../errors';
import type { Poll } from '../schema';
import { castBallot, getMyBallot, retractBallot } from '../service';
import { getTurnout } from '../status';

type Options = {
	isAuthed: boolean;
	/** Called when the API says the Poll has Ended, so the card can refetch it. */
	onPollEnded: () => void;
};

const shift = (count: number | undefined, by: number) =>
	count === undefined ? undefined : Math.max(0, count + by);

/**
 * The viewer's Ballot on one Poll: their choice, the option they have
 * selected but not yet cast, and an optimistic Turnout.
 */
export function useBallot(poll: Poll, { isAuthed, onPollEnded }: Options) {
	const { t } = useLanguage();
	const [prevPoll, setPrevPoll] = useState(poll);
	const [myOptionId, setMyOptionId] = useState(poll.myOptionId ?? null);
	const [selected, setSelected] = useState(poll.myOptionId ?? null);
	const [turnout, setTurnout] = useState(getTurnout(poll));
	const [isPending, setIsPending] = useState(false);

	// A refetched Poll carries fresh counts, and a fresh myOptionId once the API sends it
	if (poll !== prevPoll) {
		setPrevPoll(poll);
		setTurnout(getTurnout(poll));
		if (poll.myOptionId !== undefined) {
			setMyOptionId(poll.myOptionId);
			setSelected(poll.myOptionId);
		}
	}

	// Until backend 3 returns myOptionId on the Poll, ask for it separately
	const needsBallot = isAuthed && poll.myOptionId === undefined;
	useEffect(() => {
		if (!needsBallot) return;
		let ignore = false;
		getMyBallot(poll.id).then((optionId) => {
			if (ignore || !optionId) return;
			setMyOptionId(optionId);
			setSelected((current) => current ?? optionId);
		});
		return () => {
			ignore = true;
		};
	}, [poll.id, needsBallot]);

	const run = useCallback(
		async (
			request: () => Promise<ActionResult>,
			next: string | null,
			failureMessage: string
		) => {
			const previous = myOptionId;
			const turnoutDelta = (next ? 1 : 0) - (previous ? 1 : 0);

			setIsPending(true);
			setMyOptionId(next);
			setSelected(next);
			setTurnout((count) => shift(count, turnoutDelta));

			const result = await request();
			setIsPending(false);
			if (result.ok) return;

			setMyOptionId(previous);
			setSelected(previous);
			setTurnout((count) => shift(count, -turnoutDelta));
			if (isPollEnded(result)) {
				toast(t('poll.justEnded'));
				onPollEnded();
			} else {
				toast.error(failureMessage);
			}
		},
		[myOptionId, onPollEnded, t]
	);

	/** Casts a first Ballot or replaces the current one. */
	const cast = useCallback(
		(optionId: string) =>
			run(() => castBallot(poll.id, optionId), optionId, t('poll.voteFailed')),
		[poll.id, run, t]
	);

	const retract = useCallback(
		() => run(() => retractBallot(poll.id), null, t('poll.withdrawFailed')),
		[poll.id, run, t]
	);

	return { myOptionId, selected, setSelected, turnout, isPending, cast, retract };
}

export type BallotState = ReturnType<typeof useBallot>;
