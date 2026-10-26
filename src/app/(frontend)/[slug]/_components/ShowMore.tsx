'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE = 20;

/** The first `PAGE` items of a list already in hand, and more on request; `resetKey` starts over (a new filter). */
export function usePaged<T>(items: T[], resetKey: string) {
	const [shown, setShown] = useState({ key: resetKey, count: PAGE });
	const count = shown.key === resetKey ? shown.count : PAGE;
	return {
		items: items.slice(0, count),
		hasMore: items.length > count,
		more: () => setShown({ key: resetKey, count: count + PAGE }),
	};
}

/** "Show more" under a profile list: a `usePaged` list, or a cursor list (which can be loading or offer a retry). */
export function ShowMore({
	paged,
}: {
	paged: { hasMore: boolean; more: () => void; isLoading?: boolean; loadFailed?: boolean };
}) {
	const { t } = useLanguage();
	if (!paged.hasMore) return null;
	return (
		<Button variant="outline" size="md" loading={paged.isLoading} onClick={paged.more} className="mt-2 self-center">
			{paged.loadFailed ? t('comments.retry') : t('profile.showMore')}
		</Button>
	);
}
