'use client';

import { useLanguage } from '@/contexts/LanguageContext';

/** A translated string for Server Components, which can't call `useLanguage()`. */
export function T({ k }: { k: string }) {
	const { t } = useLanguage();
	return t(k);
}
