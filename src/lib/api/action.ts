import { unstable_rethrow } from 'next/navigation';

import { ApiError, AuthError } from '@/lib/api/client';

export type ActionFailure = {
	ok: false;
	status?: number;
	errorCode?: string;
	message: string;
};

/**
 * Server Actions return this instead of throwing: errors thrown across the
 * action boundary lose their status and errorCode in production.
 */
export type ActionResult<T = void> = { ok: true; data: T } | ActionFailure;

function toFailure(error: unknown): ActionFailure {
	unstable_rethrow(error);
	if (error instanceof ApiError) {
		return {
			ok: false,
			status: error.statusCode,
			errorCode: error.data?.errorCode,
			message: error.message,
		};
	}
	if (error instanceof AuthError) {
		return { ok: false, status: error.statusCode, errorCode: error.errorCode ?? 'auth.token.expired', message: error.message };
	}
	return { ok: false, message: error instanceof Error ? error.message : 'Request failed' };
}

/** Runs a request as a Server Action result: never throws, except Next's redirects. */
export async function attempt<T>(request: () => Promise<T>): Promise<ActionResult<T>> {
	try {
		return { ok: true, data: await request() };
	} catch (error) {
		return toFailure(error);
	}
}
