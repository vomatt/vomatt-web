'use server';

export async function getVerifyCode(email: string) {
	try {
		const res = await fetch(
			`${process.env.API_URL}/auth/generateVerifyCode?email=${email}`
		);
		const data = await res.json();

		if (!data) {
			return {
				status: 'error',
			};
		}
		return {
			status: 'success',
		};
	} catch (error) {
		return {
			error,
			status: 'error',
		};
	}
}
