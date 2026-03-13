import { NextRequest, NextResponse } from 'next/server';

import { ApiError, apiClient } from '@/lib/api/client';

export async function PATCH(request: NextRequest) {
	const body = await request.json();

	try {
		const response = await apiClient('/api/v1/users/me', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
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
