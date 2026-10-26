import { NextResponse } from 'next/server';

import { getUserSession } from '@/data/auth';
import { getUserProfile } from '@/lib/api/services/users';

// The body depends on who asks (signed in, it carries their relation), so no cache may
// reuse it: a signed-out answer kept past sign-in would hide Follow. The card caches per page.
const headers = { 'Cache-Control': 'private, no-store' };

/**
 * The profile behind the hover card; 404 when no one uses the username.
 * Signed in, it says whether the viewer follows or blocked the person, except
 * on the viewer's own card, where there is no one to follow.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
	const { username } = await params;
	const session = await getUserSession();
	const profile = await getUserProfile(username);
	if (!profile) return NextResponse.json(null, { status: 404, headers });
	if (profile.id === session?.sub) return NextResponse.json({ ...profile, isFollowing: null, isBlocked: null }, { headers });
	return NextResponse.json(profile, { headers });
}
