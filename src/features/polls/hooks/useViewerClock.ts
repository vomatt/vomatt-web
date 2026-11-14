import { useState } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { serverNow } from '@/lib/clock';

import type { ViewerClock } from '../timing';

/**
 * The viewer's clock (corrected to the server's, see lib/clock) once hydrated; null on the server and during hydration, where the
 * time zone and the current time differ from the browser's. `now` is the time the component
 * mounted, so a re-render never moves it. Every poll date reads it.
 */
export function useViewerClock(): ViewerClock | null {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [now] = useState(serverNow);
	return isHydrated ? { now, language: currentLanguage, t } : null;
}
