import { SIGNED_IN_FEED_ROOTS } from '@/features/polls/feeds';

export const checkIfActive = ({
	pathName,
	url,
	isChild,
}: {
	pathName: string;
	url: string;
	isChild?: any;
}) => {
	if (isChild) {
		return pathName.split('/')[1] == url.split('/')[1];
	} else {
		return pathName == url;
	}
};

/** A nav link is active on its own page and every page below it; home only on itself. */
export const isActivePath = (pathname: string, href: string) =>
	href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

export const resolveHref = ({
	documentType,
	slug,
}: {
	documentType: string | undefined;
	slug: string | undefined;
}) => {
	switch (documentType) {
		case 'pHome':
			return '/';
		case 'pGeneral':
			return `/${slug}`;
		case 'articlePage':
			return `/article/${slug}`;
		case 'externalUrl':
			return slug;

		default:
			console.warn('Invalid document type:', documentType);
			return slug ? `/${slug}` : undefined;
	}
};

/** Pages that render without the app chrome (sidebar, phone header, TabBar). */
export const isChromeless = (pathname: string) => pathname === '/login';

/** An absolute URL on this site, for metadata that crawlers read off-site. */
export const siteUrl = (path = '') => `${process.env.SITE_URL}${path}`;

/** A user's profile; it shares the root with Sanity pages. */
export const profileHref = (username: string) => `/${encodeURIComponent(username)}`;

/** The viewer's profile; /account redirects there, so link to it directly when the username is known and it shows as current. */
export const accountHref = (username?: string) => (username ? profileHref(username) : '/account');

export const pollHref = (id: string) => `/poll/${encodeURIComponent(id)}`;

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
