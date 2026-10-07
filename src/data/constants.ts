export const ACCESS_TOKEN = 'accessToken';
export const REFRESH_TOKEN = 'refreshToken';

export const USER_SESSION = 'USER_SESSION';
export const USER_LANG = 'USER_LANG';

export const STATUS_LOG_IN = 'STATUS_LOG_IN';
export const STATUS_SIGN_UP = 'STATUS_SIGN_UP';
export const STATUS_VERIFICATION = 'STATUS_VERIFICATION';


// Fallbacks; the access cookie normally follows the token's own `exp`.
export const ACCESS_TOKEN_EXPIRY = 60 * 60; // 1 hour, the backend default
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days, the backend default
/** Refresh this long before the access token expires, so a request never carries a token that dies mid-flight. */
export const ACCESS_TOKEN_REFRESH_LEEWAY = 60; // seconds
