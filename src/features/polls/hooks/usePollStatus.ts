import { useEffect, useEffectEvent, useState } from 'react';

import { serverNow } from '@/lib/clock';

import { derivePollStatus, isRevealed, nextStatusChange, type PollStatus, type StatusFields } from '../status';

// A longer setTimeout fires at once; the tick after it waits again
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * The Poll's status and, once Ended but not yet revealed, when its counts come out, moved on by the clock while it is on screen, so a
 * page left open past the end shows it Ended without a reload. `onEnded` runs when the clock (not a
 * refetch) Ends it. Passing `revealAt` doesn't call it again: the Results fetch the counts themselves.
 */
export function usePollStatus(
	poll: StatusFields,
	onEnded?: () => void
): { status: PollStatus; sealedUntil: string | null } {
	const [now, setNow] = useState(serverNow);
	const next = nextStatusChange(poll, now);

	const tick = useEffectEvent(() => {
		const time = serverNow();
		const wasEnded = derivePollStatus(poll, now) === 'ended';
		setNow(time);
		if (!wasEnded && derivePollStatus(poll, time) === 'ended') onEnded?.();
	});

	useEffect(() => {
		if (next === null) return;
		const timer = setTimeout(tick, Math.min(next - serverNow(), MAX_TIMEOUT_MS));
		return () => clearTimeout(timer);
	}, [next, now]);

	const status = derivePollStatus(poll, now);
	return { status, sealedUntil: status === 'ended' && !isRevealed(poll, now) ? (poll.revealAt ?? null) : null };
}
