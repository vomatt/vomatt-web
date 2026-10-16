import { NextResponse } from 'next/server';

import { getUserProfile } from '@/lib/api/services/users';

// Public data the server already caches for 60s; browsers may reuse it for as long
const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=60' };

/** The public profile behind the hover card; 404 when no one uses the username. */
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
	const { username } = await params;
	const profile = await getUserProfile(username);
	if (!profile) return NextResponse.json(null, { status: 404, headers: CACHE_HEADERS });
	return NextResponse.json(profile, { headers: CACHE_HEADERS });
}
