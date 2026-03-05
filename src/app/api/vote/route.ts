import { NextRequest, NextResponse } from 'next/server';

import { ApiError, apiAuthFetch } from '@/app/api/lib/apiAuthFetch';

export async function POST(request: NextRequest) {
	const { pollId, optionId } = await request.json();

	if (!pollId || !optionId) {
		return NextResponse.json(
			{ status: 'ERROR', message: 'pollId and optionId are required' },
			{ status: 400 }
		);
	}

	try {
		const response = await apiAuthFetch(
			`/api/v1/votes/${pollId}/options/${optionId}`,
			{ method: 'POST' }
		);
		return NextResponse.json({ status: 'SUCCESS', data: response });
	} catch (error) {
		if (error instanceof ApiError) {
			return NextResponse.json(
				{ status: 'ERROR', message: error.message },
				{ status: error.statusCode }
			);
		}
		return NextResponse.json(
			{ status: 'ERROR', message: 'Something went wrong' },
			{ status: 500 }
		);
	}
}
