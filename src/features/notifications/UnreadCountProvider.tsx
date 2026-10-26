'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { getUnreadCount } from './service';

/** The API has no push: poll while the tab is visible, and on coming back to it. */
export const UNREAD_POLL_MS = 60_000;

/** The API stops counting at 100, which means 100 or more. */
export function formatUnreadCount(count: number) {
	return count > 99 ? '99+' : String(count);
}

type UnreadCount = {
	/** Unread notifications; 0 when signed out or not loaded yet. */
	count: number;
	/** Whether `count` came from the API. */
	isLoaded: boolean;
	refresh: () => void;
};

const UnreadCountContext = createContext<UnreadCount>({
	count: 0,
	isLoaded: false,
	refresh: () => {},
});

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
	const [count, setCount] = useState<number | null>(null);
	// The session ended since the page loaded: stop asking
	const [sessionEnded, setSessionEnded] = useState(false);
	const isActive = signedIn && !sessionEnded;

	const refresh = useCallback(() => {
		getUnreadCount().then(
			(next) => (next === null ? setSessionEnded(true) : setCount(next)),
			// A failed check keeps the last count rather than flashing it away
			() => {}
		);
	}, []);

	useEffect(() => {
		if (!isActive) return;
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
	}, [isActive, refresh]);

	return (
		<UnreadCountContext.Provider
			value={{ count: isActive ? (count ?? 0) : 0, isLoaded: isActive && count !== null, refresh }}
		>
			{children}
		</UnreadCountContext.Provider>
	);
}
