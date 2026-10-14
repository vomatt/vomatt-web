import type { PollFormValues } from './components/PollCreator/formSchema';
import { EMPTY_INVITEES } from './invitees';
import { DEFAULT_AUDIENCE } from './schema';

/** Drafts stay in local storage; they never reach the API. */
const STORAGE_KEY = 'vomatt_poll_drafts';

export type PollDraft = { id: string; savedAt: string; values: PollFormValues };

export function listDrafts(): PollDraft[] {
	try {
		const drafts: PollDraft[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
		if (!Array.isArray(drafts)) return [];
		// Drafts saved before Audience existed lack it and the Invitees
		return drafts.map((draft) => ({
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

function writeDrafts(drafts: PollDraft[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
	} catch {
		// ignore storage errors
	}
}

/** Saves a new draft, or overwrites the draft with the same id. Newest first. */
export function saveDraft(values: PollFormValues, id: string = crypto.randomUUID()) {
	const draft: PollDraft = { id, savedAt: new Date().toISOString(), values };
	writeDrafts([draft, ...listDrafts().filter((d) => d.id !== id)]);
	return draft;
}

/** Returns the remaining drafts. */
export function deleteDraft(id: string) {
	const drafts = listDrafts().filter((d) => d.id !== id);
	writeDrafts(drafts);
	return drafts;
}
