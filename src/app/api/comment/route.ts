import { NextRequest, NextResponse } from 'next/server';

import { ApiError, apiAuthFetch } from '@/app/api/lib/apiAuthFetch';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const pollId = searchParams.get('pollId');

	if (!pollId) {
		return NextResponse.json(
			{ status: 'ERROR', message: 'pollId is required' },
			{ status: 400 }
		);
	}

	try {
		const response = await apiAuthFetch(`/api/v1/votes/${pollId}/comments`);
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

export async function POST(request: NextRequest) {
	const { pollId, text } = await request.json();

	if (!pollId || !text?.trim()) {
		return NextResponse.json(
			{ status: 'ERROR', message: 'pollId and text are required' },
			{ status: 400 }
		);
	}

	try {
		const response = await apiAuthFetch(`/api/v1/votes/${pollId}/comments`, {
			method: 'POST',
			body: JSON.stringify({ text }),
		});
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
