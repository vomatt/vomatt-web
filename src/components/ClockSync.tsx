'use client';

import { syncClock } from '@/lib/clock';

/**
 * Lines the browser's poll clock up with the server's. It runs while rendering, not in an effect,
 * so the components below it read the corrected time on their first render.
 */
export function ClockSync({ serverTime }: { serverTime: number }) {
	if (typeof window !== 'undefined') syncClock(serverTime);
	return null;
}
