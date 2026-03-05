import { NextRequest, NextResponse } from 'next/server';

import { mockPolls } from '@/app/api/get-polls/mockData';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;

	try {
		const url = `${process.env.API_URL}/api/v1/votes/${id}`;
		const res = await fetch(url);
		const resData = await res.json();
		const { success, data } = resData || {};
		if (success) {
			return NextResponse.json({ status: 'SUCCESS', data });
		}
	} catch {
		// fall through to mock
	}

	const mock = mockPolls.find((p) => p.id === id) ?? null;
	return NextResponse.json({ status: 'SUCCESS', data: mock });
}
