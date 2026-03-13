import { NextResponse } from 'next/server';

import { ApiError, apiClient } from '@/lib/api/client';
import { mockPollsPage } from '@/app/api/get-polls/mockData';

export async function GET() {
	try {
		const response = await apiClient('/api/v1/votes/my');
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
