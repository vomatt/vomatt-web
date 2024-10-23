import { experimental_taintObjectReference } from 'react';

export async function getUserData(id: string) {
	const data = {};
	experimental_taintObjectReference(
		'Do not pass user data to the client',
		data
	);
	return data;
}
