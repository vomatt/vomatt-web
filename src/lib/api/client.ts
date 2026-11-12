import { cookies, headers as requestHeaders } from 'next/headers';

import { ACT_AS } from '@/data/constants';
import { getActingCommunityId, getTokens } from '@/lib/api/auth';
import { backendFetch } from '@/lib/api/backend-fetch';
import { clientHeaders } from '@/lib/api/client-ip';
import { API_BASE_PATH } from '@/lib/api/constants';
import { getServerLocale } from '@/lib/getServerLocale';

interface ApiFetchOptions extends RequestInit {
	isFormData?: boolean;
	/** 'optional' sends the request without a token when signed out instead of throwing. */
	auth?: 'required' | 'optional';
	/** false sends the request as the signed-in user even while they act as a community account. */
	actAs?: false;
}

export class AuthError extends Error {
	constructor(
		message: string,
		public statusCode: number = 401,
		/** `auth.session_revoked`: this sign-in was ended elsewhere; signing in again is the only way on. */
		public errorCode?: string
	) {
		super(message);
		this.name = 'AuthError';
	}
}

export class ApiError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public data?: any,
		/** Seconds to wait before retrying, from a 429's `Retry-After`. */
		public retryAfter?: number
	) {
		super(message);
		this.name = 'ApiError';
	}
}

// The person's own routes, which the API refuses while acting (vomatt-api SecurityEndpoints.ACT_AS_DENIED)
const PERSONAL = /^\/(auth\/passkey\/register|users\/me\/(passkeys|sessions|export|phone))(\/|$)/;

// A route that names its community account: the API checks the real member's role on it, so a refusal is about that account
const COMMUNITY = /^\/communities\/[^/?]+/;

function isPersonal(endpoint: string, method: string) {
	const path = endpoint.split('?')[0];
	return PERSONAL.test(path) || (method === 'DELETE' && /^\/users\/[^/]+$/.test(path));
}

function readRetryAfter(response: Response) {
	const seconds = Number(response.headers.get('Retry-After'));
	return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/**
 * Parse a response from the backend's standard ApiResponse<T> envelope.
 * Uses HTTP status as the authoritative success indicator — the app-level
 * `success` boolean is not reliable across all endpoints.
 */
async function parseApiResponseBody<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let errorMessage = `Request failed with status ${response.status}`;
		let errorData: any;
		try {
			const text = await response.text();
			errorData = text ? JSON.parse(text) : undefined;
			errorMessage = errorData?.message ?? errorData?.errorCode ?? errorMessage;
		} catch {}
		throw new ApiError(errorMessage, response.status, errorData, readRetryAfter(response));
	}

	const contentType = response.headers.get('content-type');
	if (!contentType?.includes('application/json')) {
		return undefined as unknown as T;
	}

	const text = await response.text();
	if (!text) return undefined as unknown as T;

	const body = JSON.parse(text);
	// Unwrap ApiResponse envelope when present; fall back to raw body
	return ('data' in body ? body.data : body) as T;
}

/**
 * Fetch a public (unauthenticated) backend endpoint.
 * Pass a path relative to the API version prefix, e.g. `/votes`.
 * The full URL is built from API_URL + API_BASE_PATH automatically.
 */
export async function publicFetch<T = any>(
	endpoint: string,
	options?: RequestInit
): Promise<T> {
	const baseUrl = process.env.API_URL;
	const response = await backendFetch(`${baseUrl}${API_BASE_PATH}${endpoint}`, options);

	return parseApiResponseBody<T>(response);
}

/**
 * Fetches a backend endpoint as the signed-in user.
 *
 * Tokens are refreshed only in the proxy, before the request reaches React:
 * the backend rotates refresh tokens, and a rotation made here during a
 * Server Component render could not be saved to the browser, which would sign
 * the user out on their next request. A 401 here means the session
 * is really over.
 */
export async function apiClient<T = any>(
	endpoint: string,
	options: ApiFetchOptions = {}
): Promise<T> {
	const {
		isFormData = false,
		auth = 'required',
		actAs,
		headers: customHeaders,
		...fetchOptions
	} = options;

	const headers = new Headers(customHeaders);
	if (!isFormData && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	const accessToken = (await getTokens())?.accessToken;
	if (!accessToken) {
		if (auth === 'optional') return publicFetch<T>(endpoint, { ...fetchOptions, headers });
		throw new AuthError('Not authenticated. Please log in.');
	}

	headers.set('Authorization', `Bearer ${accessToken}`);
	// Per-user rate limits on writes; only here, since cached public reads aren't limited
	for (const [name, value] of Object.entries(clientHeaders(await requestHeaders()))) headers.set(name, value);
	// Error messages the UI shows as-is come back in the viewer's language. Only
	// here: on cached public requests the header would split the cache by language.
	if (!headers.has('Accept-Language')) {
		headers.set('Accept-Language', (await getServerLocale()).payloadLocale);
	}
	// A response for one user must never land in the shared data cache
	const { next: _next, ...uncached } = fetchOptions as RequestInit & { next?: unknown };
	const method = (uncached.method ?? 'GET').toUpperCase();
	const actingId =
		actAs === false || isPersonal(endpoint, method) || COMMUNITY.test(endpoint) ? null : await getActingCommunityId();
	if (actingId) headers.set('X-Act-As', actingId);
	const send = (sent: Headers) =>
		backendFetch(`${process.env.API_URL}${API_BASE_PATH}${endpoint}`, { ...uncached, headers: sent, cache: 'no-store' });
	let response = await send(headers);
	// Removed from the community meanwhile. A read goes on as the user (the layout then ends acting); a write never
	// does, or it would post under the user's own name, so it ends acting and the page reloads as the user.
	if (actingId && response.status === 403) {
		const errorCode = await response
			.clone()
			.json()
			.then((body) => body?.errorCode, () => undefined);
		if (errorCode === 'community.not_member' && method === 'GET') {
			const asUser = new Headers(headers);
			asUser.delete('X-Act-As');
			response = await send(asUser);
		} else if (errorCode === 'community.not_member') {
			// Cookies are read-only while a page renders; there the layout ends acting on this request instead
			await cookies().then((store) => store.delete(ACT_AS)).catch(() => {});
		}
	}

	if (response.status === 401) {
		const errorCode = await response.json().then(
			(body) => (typeof body?.errorCode === 'string' ? body.errorCode : undefined),
			() => undefined
		);
		throw new AuthError('Your session has expired. Please log in again.', 401, errorCode);
	}

	return parseApiResponseBody<T>(response);
}
