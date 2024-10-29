'use server';

export async function getVerifyCode(email: string) {
	try {
		const res = await fetch(
			`${process.env.API_URL}/auth/generateVerifyCode?email=${email}`
		);
		const data = await res.json();

		console.log('🚀 ~ file: getVerifyCode.ts:8 ~ getVerifyCode ~ data:', data);

		if (!data) {
			return {
				status: 'error',
			};
		}
		return {
			status: 'success',
		};
	} catch (error) {
		console.log(
			'🚀 ~ file: getVerifyCode.ts:20 ~ getVerifyCode ~ error:',
			error
		);
		return {
			status: 'error',
		};
	}
}
