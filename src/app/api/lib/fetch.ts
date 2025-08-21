'use server';
import { getUserSession } from '@/lib';

class ApiError extends Error {
	public name: string;
	public statusCode: number;

	constructor(params: { name?: string; message: string; statusCode: number }) {
		super(params.message);
		this.name = params.name || 'ApiError';
		this.statusCode = params.statusCode;

		// Maintains proper stack trace for where our error was thrown
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ApiError);
		}
	}
}

export const authFetch = async ({
	endpoint,
	headers,
	options,
	contentType,
}: {
	endpoint: string;
	headers?: any;
	options?: any;
	contentType?: string;
}) => {
	const userSession = await getUserSession();
	try {
		const isFormData = options?.body instanceof FormData;

		const url = `${process.env.API_URL}/${endpoint}`;
		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${userSession.userToken}`,
				...(isFormData
					? {}
					: { 'Content-Type': contentType ?? 'application/json' }),
				...headers,
			},
			...options,
		});
		const data = await res.json();

		return data;
	} catch (error) {
		return error;
	}
};
