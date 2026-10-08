'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useLanguage } from '@/contexts/LanguageContext';

import { type ActionResult, isPollEnded } from '../errors';
import type { Poll } from '../schema';
import { castBallot, getMyBallot, retractBallot } from '../service';
import { getTurnout, shiftCount } from '../status';

type Options = {
	isAuthed: boolean;
	/** Called when the API says the Poll has Ended, so the card can refetch it. */
	onPollEnded: () => void;
};

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
	// Whether myOptionId reflects the server, and whether the viewer has voted or withdrawn here
	const isBallotKnown = useRef(poll.myOptionId !== undefined);
	const hasActed = useRef(false);

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
			isBallotKnown.current = true;
			// A cast or withdraw made meanwhile is newer than this answer
			if (ignore || hasActed.current || !optionId) return;
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
			hasActed.current = true;
			setIsPending(true);
			setMyOptionId(next);
			setSelected(next);

			// Right after sign-in the existing Ballot isn't loaded yet; Turnout depends on it
			const known = isBallotKnown.current || poll.myOptionId !== undefined;
			const previous = known ? myOptionId : await getMyBallot(poll.id);
			isBallotKnown.current = true;
			const turnoutDelta = (next ? 1 : 0) - (previous ? 1 : 0);
			setTurnout((count) => shiftCount(count, turnoutDelta));

			const result = await request();
			setIsPending(false);
			if (result.ok) return;

			setMyOptionId(previous);
			setSelected(previous);
			setTurnout((count) => shiftCount(count, -turnoutDelta));
			if (isPollEnded(result)) {
				toast(t('poll.justEnded'));
				onPollEnded();
			} else {
				toast.error(failureMessage);
			}
		},
		[myOptionId, onPollEnded, poll.id, poll.myOptionId, t]
	);

	/** Casts a first Ballot or replaces the current one. */
	const cast = useCallback(
		(optionId: string) =>
			run(() => castBallot(poll.id, optionId), optionId, t('poll.voteFailed')),
		[poll.id, run, t]
	);

	/** Withdraws the current Ballot; the API removes it by option. */
	const retract = useCallback(() => {
		if (!myOptionId) return;
		const optionId = myOptionId;
		return run(() => retractBallot(poll.id, optionId), null, t('poll.withdrawFailed'));
	}, [myOptionId, poll.id, run, t]);

	return { myOptionId, selected, setSelected, turnout, isPending, cast, retract };
}

export type BallotState = ReturnType<typeof useBallot>;
