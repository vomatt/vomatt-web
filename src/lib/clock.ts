/** A difference under this is the time the page took to arrive, not a wrong clock. */
const MIN_SKEW_MS = 60_000;

/** How far the server's clock is ahead of this device's. 0 on the server, and in the browser until syncClock ran. */
let offset = 0;
let synced = false;

/**
 * The current time by the server's clock. Poll statuses read it instead of Date.now(), so a device
 * whose clock is wrong doesn't show a poll as Open or Ended when it isn't.
 */
export const serverNow = () => Date.now() + offset;

/**
 * Sets the offset from the time the server rendered the page. Browser only, and only the first call
 * counts: a later render's time may come from a cached payload.
 */
export function syncClock(serverTime: number) {
	if (synced) return;
	synced = true;
	// Against the device's time when the page began to arrive, not now: on a slow connection this runs much later
	const navigation = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
	const received = navigation ? performance.timeOrigin + navigation.responseStart : Date.now();
	const skew = serverTime - received;
	if (Math.abs(skew) >= MIN_SKEW_MS) offset = skew;
}
