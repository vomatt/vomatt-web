import { NextResponse } from 'next/server';

export async function POST(req, res) {
	if (req.method !== 'POST') {
		return res.status(404).json({ error: 'must be a POST request' });
	}

	const {
		body: { listID, email },
	} = req;

	if (!email || !listID) {
		console.warn('No email or list ID provided');
		return res
			.status(404)
			.json({ error: 'Must contain an email address and list ID' });
	}

	const API_KEY = process.env.KLAVIYO_API_KEY;
	const options = {
		method: 'POST',
		headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		body: JSON.stringify({
			profiles: [{ email: email }],
		}),
	};

	const newsletterData = await fetch(
		`https://a.klaviyo.com/api/v2/list/${listID}/subscribe?api_key=${API_KEY}`,
		options
	)
		.then((response) => response.json())
		.catch((err) => console.error(err));

	return NextResponse.json(newsletterData);
}
