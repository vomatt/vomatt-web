'use client';

import { useOptionalTranslate } from '@/contexts/LanguageContext';

/** "Loading" in the reader's language; English outside a LanguageProvider. */
export function useLoadingLabel() {
	const t = useOptionalTranslate();
	return t ? t('common.loading') : 'Loading';
}

/** Screen-reader text for a busy control. */
export function LoadingLabel() {
	return <span className="sr-only">{useLoadingLabel()}</span>;
}
