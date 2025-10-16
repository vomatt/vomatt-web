export async function getPollsData() {
	try {
		const url = `${process.env.API_URL}/api/v1/votes`;
		const res = await fetch(url);
		const resData = await res.json();
		const { success, errorCode, data } = resData || {};
		if (success) {
			return data;
		}
		return { success, data };
	} catch (error) {
		return { success: false, data: null, message: error };
	}
}
