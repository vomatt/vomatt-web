'use server';

import { setAuthTokens } from '@/lib/api/auth';

export async function getVerifyCode(email: string) {
	try {
		const res = await fetch(
			`${process.env.API_URL}/api/auth/generateVerificationCode?email=${email}`
		);
		const data = await res.json();
		const { success, errorType } = data;
		if (!success) return { status: 'ERROR' as const, errorType };
		return { status: 'SUCCESS' as const };
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		return { status: 'ERROR' as const, errorType: message };
	}
}

export async function login(email: string, verificationCode: string) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/auth/signin`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, verificationCode }),
		});
		const data = await res.json();
		const { success, errorCode, token, refreshToken } = data || {};
		if (success && token) {
			await setAuthTokens({ accessToken: token, refreshToken });
			return { status: 'SUCCESS' as const };
		}
		return { status: 'ERROR' as const, message: errorCode };
	} catch {
		return { status: 'ERROR' as const, message: 'Something went wrong' };
	}
}

export async function preSignup(email: string, username: string) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/auth/pre-signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, username }),
		});
		const data = await res.json();
		const { success, message } = data || {};
		if (success) return { status: 'SUCCESS' as const };
		return { status: 'ERROR' as const, message };
	} catch {
		return {
			status: 'ERROR' as const,
			message: 'Something went wrong, please try again later',
		};
	}
}

export async function signup(data: {
	email: string;
	firstName: string;
	lastName: string;
	username: string;
	verificationCode: string;
}) {
	try {
		const res = await fetch(`${process.env.API_URL}/api/auth/signup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		const resData = await res.json();
		const { success, errorCode, token, refreshToken } = resData || {};
		if (success) {
			await setAuthTokens({ accessToken: token, refreshToken });
			return { status: 'SUCCESS' as const };
		}
		return { status: 'ERROR' as const, errorType: errorCode };
	} catch {
		return {
			status: 'ERROR' as const,
			errorType: 'serverError',
		};
	}
}
