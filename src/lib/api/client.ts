import { getTokens } from '@/lib/api/auth';
import { API_BASE_PATH } from '@/lib/api/constants';

export { API_BASE_PATH } from '@/lib/api/constants';

interface ApiFetchOptions extends RequestInit {
	isFormData?: boolean;
	/** 'optional' sends the request without a token when signed out instead of throwing. */
	auth?: 'required' | 'optional';
}

export class AuthError extends Error {
	constructor(
		message: string,
		public statusCode: number = 401
	) {
		super(message);
		this.name = 'AuthError';
	}
}

export class ApiError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public data?: any
	) {
		super(message);
		this.name = 'ApiError';
	}
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
		throw new ApiError(errorMessage, response.status, errorData);
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
	const response = await fetch(`${baseUrl}${API_BASE_PATH}${endpoint}`, options);

	return parseApiResponseBody<T>(response);
}

/**
 * Fetches a backend endpoint as the signed-in user.
 *
 * Tokens are refreshed only in the proxy, before the request reaches React:
 * the backend rotates refresh tokens, and a rotation made here during a
 * Server Component render could not be saved to the browser, which would sign
 * the user out everywhere on their next request. A 401 here means the session
 * is really over.
 */
export async function apiClient<T = any>(
	endpoint: string,
	options: ApiFetchOptions = {}
): Promise<T> {
	const {
		isFormData = false,
		auth = 'required',
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
	// A response for one user must never land in the shared data cache
	const { next: _next, ...uncached } = fetchOptions as RequestInit & { next?: unknown };
	const response = await fetch(`${process.env.API_URL}${API_BASE_PATH}${endpoint}`, {
		...uncached,
		headers,
		cache: 'no-store',
	});

	if (response.status === 401) {
		throw new AuthError('Your session has expired. Please log in again.');
	}

	return parseApiResponseBody<T>(response);
}
