import type { PollFormValues } from './components/PollCreator/formSchema';
import { EMPTY_INVITEES } from './invitees';
import { DEFAULT_AUDIENCE } from './schema';

/** Drafts stay in local storage; they never reach the API. */
const STORAGE_KEY = 'vomatt_poll_drafts';

export type PollDraft = { id: string; savedAt: string; values: PollFormValues };

function parseDrafts(raw: string | null): PollDraft[] {
	try {
		const drafts: PollDraft[] = JSON.parse(raw ?? '[]');
		if (!Array.isArray(drafts)) return [];
		// Drafts saved before Audience existed lack it and the Invitees; skip malformed entries
		return drafts.filter((draft) => draft?.values).map((draft) => ({
			...draft,
			values: {
				...draft.values,
				audience: draft.values.audience ?? DEFAULT_AUDIENCE,
				invitees: draft.values.invitees ?? EMPTY_INVITEES,
			},
		}));
	} catch {
		return [];
	}
}

const listeners = new Set<() => void>();
// Read from storage once per change, not on every render
let cached: PollDraft[] | null = null;

function changed() {
	cached = null;
	for (const listener of listeners) listener();
}

// Saves in other tabs; module-wide, so the cache never misses one while nothing is subscribed
if (typeof window !== 'undefined') {
	window.addEventListener('storage', (event) => {
		if (event.key === STORAGE_KEY || event.key === null) changed();
	});
}

function writeDrafts(drafts: PollDraft[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
	} catch {
		// ignore storage errors
	}
	changed();
}

/** For `useSyncExternalStore`: hears saves from any creator on the page, and from other tabs. */
export function subscribeDrafts(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** The same array until the stored drafts change, as `useSyncExternalStore` needs. */
export function listDrafts(): PollDraft[] {
	if (cached === null) {
		let raw: string | null = null;
		try {
			raw = localStorage.getItem(STORAGE_KEY);
		} catch (error) {
			// Blocked storage (some private modes) holds no drafts
			console.error('Reading saved drafts failed:', error);
		}
		cached = parseDrafts(raw);
	}
	return cached;
}

/** Saves a new draft, or overwrites the draft with the same id. Newest first. */
export function saveDraft(values: PollFormValues, id: string = crypto.randomUUID()) {
	const draft: PollDraft = { id, savedAt: new Date().toISOString(), values };
	writeDrafts([draft, ...listDrafts().filter((d) => d.id !== id)]);
	return draft;
}

export function deleteDraft(id: string) {
	writeDrafts(listDrafts().filter((d) => d.id !== id));
}
