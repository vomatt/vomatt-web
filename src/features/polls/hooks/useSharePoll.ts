'use client';

import { toast } from 'sonner';

import { useLanguage } from '@/contexts/LanguageContext';

/** Shares a Poll's canonical link: the native sheet where there is one, otherwise the clipboard. */
export function useSharePoll() {
	const { t } = useLanguage();

	return async ({ id, title }: { id: string; title: string }) => {
		const url = `${window.location.origin}/poll/${id}`;
		if (navigator.share) {
			await navigator.share({ title, url }).catch(() => {});
			return;
		}
		await navigator.clipboard.writeText(url);
		toast(t('poll.linkCopied'));
	};
}
