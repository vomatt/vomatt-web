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
			const shared = await navigator.share({ title, url }).then(
				() => true,
				() => false
			);
			if (shared) void sharePoll(id, 'NATIVE');
			return;
		}
		await navigator.clipboard.writeText(url);
		void sharePoll(id, 'COPY_LINK');
		toast(t('poll.linkCopied'));
	};
}
