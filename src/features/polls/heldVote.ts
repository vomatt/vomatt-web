/**
 * A guest's vote waiting on sign-in, kept in session storage so it outlives a reload: a phone may drop the tab
 * while the guest is in their mail app fetching the code. It never reaches the API until they are signed in.
 */
const STORAGE_KEY = 'vomatt_held_vote';
/** Long enough to fetch a code and come back, short enough that an old pick doesn't reappear. */
const HOLD_MS = 15 * 60_000;

type HeldVote = { pollId: string; optionId: string; heldAt: number };

export function holdVote(pollId: string, optionId: string) {
	const vote: HeldVote = { pollId, optionId, heldAt: Date.now() };
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(vote));
	} catch {
		// Without storage the vote still waits in memory for this page
	}
}

/** The option held for this poll, or null. */
export function takeHeldVote(pollId: string): string | null {
	try {
		const vote: Partial<HeldVote> = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') ?? {};
		const fresh = typeof vote.heldAt === 'number' && Date.now() - vote.heldAt <= HOLD_MS;
		return fresh && vote.pollId === pollId && typeof vote.optionId === 'string' ? vote.optionId : null;
	} catch {
		return null;
	}
}

export function releaseHeldVote() {
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// Nothing was stored
	}
}
