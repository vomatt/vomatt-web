import { SIGNED_IN_FEED_ROOTS } from '@/features/polls/feeds';
import { toShortId } from '@/features/polls/shortId';

/** A nav link is active on its own page and every page below it; home only on itself. */
export const isActivePath = (pathname: string, href: string) =>
	href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

/** Pages that render without the app chrome (sidebar, phone header, TabBar). */
export const isChromeless = (pathname: string) => pathname === '/login';

/** An absolute URL on this site, for metadata that crawlers read off-site. */
export const siteUrl = (path = '') => `${process.env.SITE_URL}${path}`;

/** A user's profile; profiles live at the root. */
export const profileHref = (username: string) => `/${encodeURIComponent(username)}`;

/** A profile's own settings pages (a community account's members page): signed in only, so the proxy protects them. */
export const profileSettingsHref = (username: string) => `${profileHref(username)}/settings`;
// Any first segment matches: a page that isn't a profile has no /settings/ below it, so it 404s either way
export const isProfileSettingsPath = (pathname: string) => /^\/[^/]+\/settings\/./.test(pathname);

/** The viewer's profile; /account redirects there, so link to it directly when the username is known and it shows as current. */
export const accountHref = (username?: string) => (username ? profileHref(username) : '/account');

/** A Poll's page, by the short form of its id; the proxy redirects a link by the full UUID here. */
export const pollHref = (id: string) => `/poll/${toShortId(id)}`;

/** The home feed filtered to one topic. */
export const topicHref = (slug: string) => `/?tag=${encodeURIComponent(slug)}`;

// Only same-origin paths; blocks open redirects like `//evil.com`, `/\\evil.com`
// or `/\t/evil.com` by resolving the path the same way the browser will.
export function getSafeRedirectPath(path: string | null) {
	if (!path?.startsWith('/')) return '/';
	const base = 'http://localhost';
	const url = new URL(path, base);
	if (url.origin !== base) return '/';
	return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * The login page. `sessionExpired` says why the visitor is there ('security': signed out after a reused token;
 * 'deleted': the account is gone; 'revoked': signed out of this device from another) and lets the page open while the proxy still sees the old token as valid.
 */
export function loginHref({
	redirect,
	sessionExpired,
}: {
	redirect?: string;
	sessionExpired?: '1' | 'security' | 'deleted' | 'revoked';
}) {
	const params = new URLSearchParams();
	if (redirect) params.set('redirect', redirect);
	if (sessionExpired) params.set('session_expired', sessionExpired);
	return params.size ? `/login?${params}` : '/login';
}

/** A comment's link: `#comment-<id>`, or `#comment-<rootId>/<replyId>` for a Reply, whose list loads on demand. */
export const commentHash = (comment: { id: string; parentId?: string | null }) =>
	`#comment-${comment.parentId ? `${comment.parentId}/${comment.id}` : comment.id}`;

/** Like commentHash, and the poll page also opens a reply composer under the comment. */
export const replyHash = (comment: { id: string; parentId?: string | null }) =>
	commentHash(comment).replace('#comment-', '#reply-');

/** Root segments that are app routes, not usernames; matches the folders in app/(frontend). */
export const APP_ROOT_SEGMENTS = ['account', 'explore', 'login', 'notifications', 'poll', 'settings', ...SIGNED_IN_FEED_ROOTS];
