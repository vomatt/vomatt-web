'use server';
import { getUserSession } from '@/lib/auth';

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
