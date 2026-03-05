import { NextResponse } from 'next/server';

import { ApiError, apiAuthFetch } from '@/app/api/lib/apiAuthFetch';
import { mockPollsPage } from '@/app/api/get-polls/mockData';

export async function GET() {
	try {
		const response = await apiAuthFetch('/api/v1/votes/my');
		return NextResponse.json({ status: 'SUCCESS', data: response });
	} catch (error) {
		if (error instanceof ApiError && error.statusCode !== 404) {
			return NextResponse.json(
				{ status: 'ERROR', message: error.message },
				{ status: error.statusCode }
			);
		}
		// Backend not ready — return mock data
		return NextResponse.json({ status: 'SUCCESS', data: mockPollsPage });
	}
}
