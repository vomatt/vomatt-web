'use client';

import { toast } from 'sonner';

import { useLanguage } from '@/contexts/LanguageContext';
import { trackEvent } from '@/lib/analytics';
import { settle } from '@/lib/api/settle';

import { sharePoll } from '../service';
import { pollUrl } from '../url';

/** Copies a Poll's canonical link and says so; counted as a share like the native sheet's. */
export function useCopyPollLink() {
	const { t } = useLanguage();

	return async (id: string) => {
		// No Clipboard API (plain http, some webviews) fails like a refused copy
		const copied = navigator.clipboard
			? await navigator.clipboard.writeText(pollUrl(id)).then(
					() => true,
					() => false
				)
			: false;
		if (!copied) {
			toast.error(t('poll.linkCopyFailed'));
			return;
		}
		void settle(sharePoll(id, 'COPY_LINK'));
		trackEvent('poll_shared', { channel: 'COPY_LINK' });
		toast(t('poll.linkCopied'));
	};
}

/**
 * Shares a Poll's canonical link: the native sheet where there is one, otherwise the clipboard.
 * Once shared, tells the API so signed-in shares are counted; a failure (e.g. signed out) is ignored.
 */
export function useSharePoll() {
	const copyLink = useCopyPollLink();

	return async ({ id, title }: { id: string; title: string }) => {
		if (navigator.share) {
			// null: the sheet failed (not dismissed), so fall back to the clipboard
			const shared = await navigator.share({ title, url: pollUrl(id) }).then(
				() => true,
				(error: unknown) => (error instanceof DOMException && error.name === 'AbortError' ? false : null)
			);
			if (shared) {
				void settle(sharePoll(id, 'NATIVE'));
				trackEvent('poll_shared', { channel: 'NATIVE' });
			}
			if (shared !== null) return;
		}
		await copyLink(id);
	};
}
