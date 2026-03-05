import { NextRequest, NextResponse } from 'next/server';

import { mockPollsPage } from './mockData';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const page = searchParams.get('page') ?? '0';

	try {
		const url = `${process.env.API_URL}/api/v1/votes?page=${page}`;
		const res = await fetch(url);
		const resData = await res.json();
		const { success, data } = resData || {};
		if (success) {
			return NextResponse.json({ status: 'SUCCESS', data });
		}
	} catch {
		// fall through to mock
	}

	return NextResponse.json({ status: 'SUCCESS', data: mockPollsPage });
}
