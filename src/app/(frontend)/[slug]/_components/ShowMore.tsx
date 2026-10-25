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

export function ShowMore({ paged }: { paged: { hasMore: boolean; more: () => void } }) {
	const { t } = useLanguage();
	if (!paged.hasMore) return null;
	return (
		<Button variant="outline" onClick={paged.more} className="mt-2 self-center">
			{t('profile.showMore')}
		</Button>
	);
}
