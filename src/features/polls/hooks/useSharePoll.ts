'use client';

import { toast } from 'sonner';

import { useLanguage } from '@/contexts/LanguageContext';

import { sharePoll } from '../service';
import { pollUrl } from '../url';

/**
 * Shares a Poll's canonical link: the native sheet where there is one, otherwise the clipboard.
 * Once shared, tells the API so signed-in shares are counted; a failure (e.g. signed out) is ignored.
 */
export function useSharePoll() {
	const { t } = useLanguage();

	return async ({ id, title }: { id: string; title: string }) => {
		const url = pollUrl(id);
		if (navigator.share) {
			// null: the sheet failed (not dismissed), so fall back to the clipboard
			const shared = await navigator.share({ title, url }).then(
				() => true,
				(error: unknown) => (error instanceof DOMException && error.name === 'AbortError' ? false : null)
			);
			if (shared) void sharePoll(id, 'NATIVE');
			if (shared !== null) return;
		}
		const copied = await navigator.clipboard.writeText(url).then(
			() => true,
			() => false
		);
		if (!copied) {
			toast.error(t('poll.linkCopyFailed'));
			return;
		}
		void sharePoll(id, 'COPY_LINK');
		toast(t('poll.linkCopied'));
	};
}
