'use server';

export async function getVerifyCode(email: string) {
	try {
		const data = await fetch(
			`${process.env.API_URL}/user/generateVerifyCode?email=${email}`
		);

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
