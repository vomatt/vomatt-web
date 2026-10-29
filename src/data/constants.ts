export const ACCESS_TOKEN = 'accessToken';
export const REFRESH_TOKEN = 'refreshToken';
/** Set by the proxy on a request whose token refresh couldn't reach the API. */
export const SESSION_UNCONFIRMED_HEADER = 'x-session-unconfirmed';
/** Sent by SessionRetry; the proxy answers 503 while the API is still unreachable, else 204. */
export const SESSION_PROBE_HEADER = 'x-session-probe';
/** Readable cookie the proxy sets while the session is unconfirmed, for client navigations. */
export const SESSION_UNCONFIRMED = 'session-unconfirmed';

export const USER_SESSION = 'USER_SESSION';
export const USER_LANG = 'USER_LANG';

export const STATUS_LOG_IN = 'STATUS_LOG_IN';
export const STATUS_VERIFICATION = 'STATUS_VERIFICATION';


// Fallbacks; the access cookie normally follows the token's own `exp`.
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes, the backend default
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days, the backend default
/** Refresh this long before the access token expires, so a request never carries a token that dies mid-flight. */
export const ACCESS_TOKEN_REFRESH_LEEWAY = 60; // seconds
