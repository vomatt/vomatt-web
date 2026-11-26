import { act } from '@testing-library/react';

/** Runs the deferred clean-up of components unmounted earlier, such as the last test's. */
export const settleUnmounts = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

/** Lets the deferred clean-up of an unmount run, as leaving the page does. */
export async function leavePage(unmount: () => void) {
	unmount();
	await settleUnmounts();
}

/** A reload: the page goes without React's clean-up, and session storage stays as it was. */
export async function reload(unmount: () => void) {
	const kept = Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.key(index)!).map(
		(key) => [key, sessionStorage.getItem(key)!] as const
	);
	await leavePage(unmount);
	sessionStorage.clear();
	kept.forEach(([key, value]) => sessionStorage.setItem(key, value));
}
