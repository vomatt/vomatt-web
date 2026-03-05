import { NextRequest, NextResponse } from 'next/server';

// Placeholder route — backend draft endpoint not yet available.
// The client also persists drafts in localStorage for immediate recovery.
export async function POST(request: NextRequest) {
	const body = await request.json();

	// TODO: forward to backend when endpoint is ready:
	// await apiAuthFetch('/api/v1/votes/drafts', { method: 'POST', body: JSON.stringify(body) });

	return NextResponse.json({ status: 'SUCCESS', data: body });
}
