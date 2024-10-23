'use server';
import { getUserSession } from '@/lib';

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
