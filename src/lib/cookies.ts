const YEAR = 365 * 24 * 60 * 60;

/** Set once the visitor closes How vomatt counts in the sidebar; a plain module, so the server layout reads the real name. */
export const HOW_COUNTS_DISMISSED_COOKIE = 'how-counts-dismissed';

/** A year-long cookie, set on vomatt.com on its hosts so the app and about.vomatt.com share it; an empty value clears it. */
export function sharedCookie(name: string, value: string, hostname: string) {
	const shared = hostname === 'vomatt.com' || hostname.endsWith('.vomatt.com');
	return `${name}=${value}; path=/; max-age=${value ? YEAR : 0}; samesite=lax${shared ? '; domain=vomatt.com' : ''}`;
}

/** A cookie's value in the browser, or null when it isn't set. */
export function readCookie(name: string) {
	return document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? null;
}
