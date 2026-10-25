import { NextResponse } from 'next/server';

import { getUserSession } from '@/data/auth';
import { getUserProfile, getUserProfileForViewer } from '@/lib/api/services/users';

// Public data the server already caches for 60s; browsers may reuse it for as long
const PUBLIC_CACHE = { 'Cache-Control': 'public, max-age=60' };
// Signed in, the profile carries the viewer's own relation to it
const PRIVATE_CACHE = { 'Cache-Control': 'private, no-store' };

/**
 * The profile behind the hover card; 404 when no one uses the username.
 * Signed in, it says whether the viewer follows or blocked the person, except
 * on the viewer's own card, where there is no one to follow.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
	const { username } = await params;
	const session = await getUserSession();
	const headers = session ? PRIVATE_CACHE : PUBLIC_CACHE;
	const profile = session ? await getUserProfileForViewer(username) : await getUserProfile(username);
	if (!profile) return NextResponse.json(null, { status: 404, headers });
	if (profile.id === session?.sub) return NextResponse.json({ ...profile, isFollowing: null, isBlocked: null }, { headers });
	return NextResponse.json(profile, { headers });
}
