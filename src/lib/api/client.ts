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

	if (!response.ok) {
		let errorMessage = `Request failed with status ${response.status}`;
		let errorData;

		try {
			errorData = await response.json();
			errorMessage = errorData.message || errorData.error || errorMessage;
		} catch {
			errorMessage = await response.text().catch(() => errorMessage);
		}

		throw new ApiError(errorMessage, response.status, errorData);
	}

	const contentType = response.headers.get('content-type');
	if (contentType?.includes('application/json')) {
		return await response.json();
	}

	return response as any;
}
