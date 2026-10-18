'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useLanguage } from '@/contexts/LanguageContext';
import { apiErrorText } from '@/lib/api/error-text';

import { type ActionResult, isBusy, isPollEnded, isRateLimited } from '../errors';
import type { Poll } from '../schema';
import { castBallot, getMyBallot, getPoll, retractBallot } from '../service';
import { derivePollStatus, getTurnout, shiftCount } from '../status';

export type BallotOutcome = 'saved' | 'failed' | 'ended';
/** What a request in flight is doing: a first vote, a changed vote, a withdrawal or the anonymity switch. */
export type BallotAction = 'vote' | 'update' | 'retract' | 'anonymous';

type Options = {
	isAuthed: boolean;
	/**
	 * Called when the API says the Poll has Ended, so the card can refetch it.
	 * When the viewer's Ballot itself Ended it (the last one an Invite-only
	 * Poll waited for), the Ended Poll comes along.
	 */
	onPollEnded: (poll?: Poll) => void;
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
	// Null while there is no Ballot, or while it is not known whether it is Anonymous
	const [anonymous, setAnonymousFlag] = useState(poll.myBallotAnonymous ?? null);
	const [turnout, setTurnout] = useState(getTurnout(poll));
	const [pendingAction, setPendingAction] = useState<BallotAction | null>(null);
	// A guest's Poll says null for "no Ballot", which means nothing once they sign in here
	const [loadedSignedIn] = useState(isAuthed);
	const hasServerBallot = loadedSignedIn && poll.myOptionId !== undefined;
	// Whether myOptionId reflects the server, and whether the viewer has voted or withdrawn here
	const isBallotKnown = useRef(hasServerBallot);
	const hasActed = useRef(false);

	// A refetched Poll carries fresh counts, and a fresh myOptionId once the API sends it
	if (poll !== prevPoll) {
		setPrevPoll(poll);
		setTurnout(getTurnout(poll));
		if (poll.myOptionId !== undefined) {
			setMyOptionId(poll.myOptionId);
			setSelected(poll.myOptionId);
			setAnonymousFlag(poll.myBallotAnonymous ?? null);
		}
	}

	// Signed in after the Poll loaded: ask for the Ballot separately
	const needsBallot = isAuthed && !hasServerBallot;
	useEffect(() => {
		if (!needsBallot) return;
		let ignore = false;
		getMyBallot(poll.id).then((optionId) => {
			isBallotKnown.current = true;
			// A cast or withdraw made meanwhile is newer than this answer
			if (ignore || hasActed.current || !optionId) return;
			setMyOptionId(optionId);
			setSelected((current) => current ?? optionId);
			// The status call doesn't say whether the Ballot is Anonymous; the Poll does
			getPoll(poll.id)
				.catch(() => null)
				.then((fresh) => {
					if (!ignore && !hasActed.current) setAnonymousFlag(fresh?.myBallotAnonymous ?? null);
				});
		});
		return () => {
			ignore = true;
		};
	}, [poll.id, needsBallot]);

	const run = useCallback(
		async (
			action: BallotAction,
			request: () => Promise<ActionResult<Poll | void>>,
			next: string | null,
			failureMessage: string
		): Promise<BallotOutcome> => {
			hasActed.current = true;
			setPendingAction(action);
			setMyOptionId(next);
			setSelected(next);
			const previousAnonymous = anonymous;

			let previous: string | null;
			let turnoutDelta: number;
			let result: ActionResult<Poll | void>;
			// Nothing in flight may leave the Ballot busy
			try {
				// Right after sign-in the existing Ballot isn't loaded yet; Turnout depends on it
				const known = isBallotKnown.current || hasServerBallot;
				previous = known ? myOptionId : await getMyBallot(poll.id);
				isBallotKnown.current = true;
				turnoutDelta = (next ? 1 : 0) - (previous ? 1 : 0);
				setTurnout((count) => shiftCount(count, turnoutDelta));

				// A thrown call (the network dropped) fails like any other, so it is rolled back too
				const send = () =>
					request().catch(
						(error): ActionResult<Poll | void> => ({
							ok: false,
							message: error instanceof Error ? error.message : 'Request failed',
						})
					);
				result = await send();
				// Busy means nothing was recorded; the API asks for one retry
				if (isBusy(result)) result = await send();
			} finally {
				setPendingAction(null);
			}
			if (result.ok) {
				setAnonymousFlag(result.data?.myBallotAnonymous ?? null);
				if (result.data && derivePollStatus(result.data) === 'ended') onPollEnded(result.data);
				return 'saved';
			}

			setMyOptionId(previous);
			setSelected(previous);
			setAnonymousFlag(previousAnonymous);
			setTurnout((count) => shiftCount(count, -turnoutDelta));
			if (isPollEnded(result)) {
				toast(t('poll.justEnded'));
				onPollEnded();
				return 'ended';
			}
			if (isRateLimited(result)) toast.error(t('poll.tooManyVotes'));
			// Still busy after the retry: common.conflict shows common.busy
			else if (isBusy(result)) toast.error(apiErrorText(t, result));
			else toast.error(failureMessage);
			return 'failed';
		},
		[anonymous, hasServerBallot, myOptionId, onPollEnded, poll.id, t]
	);

	/** Casts a first Ballot or replaces the current one. Resolves to the outcome. */
	const cast = useCallback(
		(optionId: string) =>
			run(myOptionId ? 'update' : 'vote', () => castBallot(poll.id, optionId), optionId, t('poll.voteFailed')),
		[myOptionId, poll.id, run, t]
	);

	/** Withdraws the current Ballot. Resolves to the outcome. */
	const retract = useCallback(async (): Promise<BallotOutcome> => {
		// Nothing to withdraw is already the desired state, not a failure
		if (!myOptionId) return 'saved';
		return run('retract', () => retractBallot(poll.id), null, t('poll.withdrawFailed'));
	}, [myOptionId, poll.id, run, t]);

	/** Recasts the current option to add or drop the Ballot from the voter list. */
	const setAnonymous = useCallback(
		(value: boolean) => {
			setAnonymousFlag(value);
			return run('anonymous', () => castBallot(poll.id, myOptionId!, value), myOptionId, t('poll.voteFailed'));
		},
		[myOptionId, poll.id, run, t]
	);

	return {
		myOptionId,
		selected,
		setSelected,
		anonymous,
		setAnonymous,
		turnout,
		isPending: pendingAction !== null,
		pendingAction,
		cast,
		retract,
	};
}

export type BallotState = ReturnType<typeof useBallot>;
