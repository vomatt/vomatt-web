'use server';

export async function getVerifyCode(email: string) {
	try {
		const res = await fetch(
			`${process.env.API_URL}/api/auth/generateVerificationCode?email=${email}`
		);
		const data = await res.json();
		const { success, errorCode } = data;
		if (!success) {
			return {
				status: 'ERROR',
				message: errorCode,
			};
		}
		return {
			status: 'SUCCESS',
		};
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);

		return {
			status: 'ERROR',
			message,
		};
	}
}
