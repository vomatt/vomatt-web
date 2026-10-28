// The API's rule (UpdateProfileRequest.username), reserved names included
export const USERNAME_MAX_LENGTH = 50;

// `api`, `me` and `my` are also too short; they stay listed to match the API
export const RESERVED_USERNAMES = new Set([
	'search',
	'account',
	'explore',
	'following',
	'login',
	'notifications',
	'poll',
	'sanity',
	'api',
	'me',
	'my',
	'admin',
	'settings',
]);

const USERNAME_PATTERN = new RegExp(`^[a-z0-9_]{3,${USERNAME_MAX_LENGTH}}$`);

export const isValidUsername = (username: string) =>
	!RESERVED_USERNAMES.has(username) && USERNAME_PATTERN.test(username);

/** The username a root URL segment names; null when the segment isn't valid percent-encoding. */
export function usernameFromSlug(slug: string): string | null {
	try {
		return decodeURIComponent(slug);
	} catch {
		return null;
	}
}

/** Whether `username` is the viewer's own; case-insensitive, as profile lookups may be. */
export const isOwnUsername = <T extends { username: string }>(
	me: T | null,
	username: string
): me is T => !!me && me.username.toLowerCase() === username.toLowerCase();
