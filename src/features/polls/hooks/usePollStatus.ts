import { useEffect, useEffectEvent, useState } from 'react';

import { derivePollStatus, isRevealed, nextStatusChange, type PollStatus, type StatusFields } from '../status';

// A longer setTimeout fires at once; the tick after it waits again
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * The Poll's status and whether its counts are out, moved on by the clock while it is on screen, so a
 * page left open past the end shows it Ended without a reload. `onEnded` runs when the clock (not a
 * refetch) Ends it. Passing `revealAt` doesn't call it again: the Results fetch the counts themselves.
 */
export function usePollStatus(
	poll: StatusFields,
	onEnded?: () => void
): { status: PollStatus; revealed: boolean } {
	const [now, setNow] = useState(Date.now);
	const next = nextStatusChange(poll, now);

	const tick = useEffectEvent(() => {
		const time = Date.now();
		const wasEnded = derivePollStatus(poll, now) === 'ended';
		setNow(time);
		if (!wasEnded && derivePollStatus(poll, time) === 'ended') onEnded?.();
	});

	useEffect(() => {
		if (next === null) return;
		const timer = setTimeout(tick, Math.min(next - Date.now(), MAX_TIMEOUT_MS));
		return () => clearTimeout(timer);
	}, [next, now]);

	return { status: derivePollStatus(poll, now), revealed: isRevealed(poll, now) };
}
