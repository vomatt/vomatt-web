'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getUnreadCount } from './service';

/** The API has no push: poll while the tab is visible, and on coming back to it. */
export const UNREAD_POLL_MS = 60_000;

type UnreadCount = {
	/** Unread Ended Notifications; 0 when signed out or not loaded yet. */
	count: number;
	refresh: () => void;
};

const UnreadCountContext = createContext<UnreadCount>({ count: 0, refresh: () => {} });

export function useUnreadCount() {
	return useContext(UnreadCountContext);
}

/** One poller for the whole layout, so the sidebar and tab bar share a count. */
export function UnreadCountProvider({
	signedIn,
	children,
}: {
	signedIn: boolean;
	children: React.ReactNode;
}) {
	const [count, setCount] = useState(0);

	const refresh = useCallback(() => {
		// A failed check keeps the last count rather than flashing it away
		getUnreadCount().then(setCount, () => {});
	}, []);

	useEffect(() => {
		if (!signedIn) return;
		let timer: ReturnType<typeof setInterval> | undefined;
		const start = () => {
			refresh();
			timer = setInterval(refresh, UNREAD_POLL_MS);
		};
		const stop = () => clearInterval(timer);
		const onVisibilityChange = () => {
			stop();
			if (document.visibilityState === 'visible') start();
		};

		if (document.visibilityState === 'visible') start();
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			stop();
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [refresh, signedIn]);

	return (
		<UnreadCountContext.Provider value={{ count: signedIn ? count : 0, refresh }}>
			{children}
		</UnreadCountContext.Provider>
	);
}
