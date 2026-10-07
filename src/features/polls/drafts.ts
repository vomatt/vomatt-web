import type { PollFormValues } from './components/PollCreator/formSchema';

/** Drafts stay in local storage; they never reach the API. */
const STORAGE_KEY = 'vomatt_poll_drafts';

export type PollDraft = { id: string; savedAt: string; values: PollFormValues };

export function listDrafts(): PollDraft[] {
	try {
		const drafts = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
		return Array.isArray(drafts) ? drafts : [];
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
