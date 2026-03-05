import { NextRequest, NextResponse } from 'next/server';

import { mockPollsPage, mockPolls } from '@/app/api/get-polls/mockData';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get('q') ?? '';
	const page = searchParams.get('page') ?? '0';
	const sort = searchParams.get('sort') ?? 'newest';
	const status = searchParams.get('status') ?? 'all';

	try {
		const params = new URLSearchParams({ page, sort, status });
		if (q) params.set('q', q);

		const url = `${process.env.API_URL}/api/v1/votes?${params}`;
		const res = await fetch(url);
		const resData = await res.json();
		const { success, data } = resData || {};
		if (success) {
			return NextResponse.json({ status: 'SUCCESS', data });
		}
	} catch {
		// fall through to mock
	}

	// Mock filtering
	const lower = q.toLowerCase();
	const filtered = lower
		? mockPolls.filter(
				(p) =>
					p.title.toLowerCase().includes(lower) ||
					p.description?.toLowerCase().includes(lower)
			)
		: mockPolls;

	return NextResponse.json({
		status: 'SUCCESS',
		data: { ...mockPollsPage, content: filtered, totalElements: filtered.length },
	});
}
