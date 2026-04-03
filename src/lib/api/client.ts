import { redirect, RedirectType } from 'next/navigation';

import {
	clearAuthTokens,
	getTokens,
	refreshTokens,
	setAuthTokens,
} from '@/lib/api/auth';

interface ApiFetchOptions extends RequestInit {
	isFormData?: boolean;
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
 * Handles the ApiResponse<T> envelope and throws ApiError on failure.
 */
export async function publicFetch<T = any>(
	url: string,
	options?: RequestInit
): Promise<T> {
	const response = await fetch(url, options);

	return parseApiResponseBody<T>(response);
}

export async function apiClient<T = any>(
	endpoint: string,
	options: ApiFetchOptions = {}
): Promise<T> {
	const {
		isFormData = false,
		headers: customHeaders,
		...fetchOptions
	} = options;

	const baseUrl = process.env.API_URL;

	const headers = new Headers(customHeaders);
	if (!isFormData && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	let tokens = await getTokens();

	if (!tokens) {
		throw new AuthError('Not authenticated. Please log in.');
	}

	// If access token is missing but refresh token exists, refresh proactively
	if (!tokens.accessToken && tokens.refreshToken) {
		const newTokens = await refreshTokens(tokens.refreshToken);
		if (!newTokens) {
			await clearAuthTokens();
			redirect('/login?session_expired=true', RedirectType.replace);
		}
		await setAuthTokens(newTokens);
		tokens = newTokens;
	}

	// Add authorization header
	if (tokens?.accessToken) {
		headers.set('Authorization', `Bearer ${tokens.accessToken}`);
	}

	async function makeRequest(accessToken?: string): Promise<Response> {
		const requestHeaders = new Headers(headers);
		if (accessToken) {
			requestHeaders.set('Authorization', `Bearer ${accessToken}`);
		}

		return fetch(`${baseUrl}${endpoint}`, {
			...fetchOptions,
			headers: requestHeaders,
			credentials: 'include', // Important for cookies
		});
	}

	let response = await makeRequest(tokens?.accessToken);

	if (response.status === 401 && tokens?.refreshToken) {
		const newTokens = await refreshTokens(tokens.refreshToken);
		if (!newTokens) {
			await clearAuthTokens();

			redirect('/login?session_expired=true', RedirectType.replace);
		}

		await setAuthTokens(newTokens);
		response = await makeRequest(newTokens.accessToken);
	}

	return parseApiResponseBody<T>(response);
}
