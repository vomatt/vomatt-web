import { mockPollsPage } from './mockData';

export async function getPollsData() {
	try {
		const url = `${process.env.API_URL}/api/v1/votes`;
		const res = await fetch(url);
		const resData = await res.json();
		const { success, data } = resData || {};
		if (success) {
			return data;
		}
		return mockPollsPage;
	} catch (error) {
		return mockPollsPage;
	}
}
