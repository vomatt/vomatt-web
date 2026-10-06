import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true afterwards. Gate output that
 * depends on the browser, such as its time zone or the current time.
 */
export function useHydrated() {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false
	);
}
