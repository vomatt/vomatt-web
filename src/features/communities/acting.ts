'use server';

import { cookies } from 'next/headers';

import { ACT_AS, REFRESH_TOKEN_EXPIRY } from '@/data/constants';
import type { ActionResult } from '@/lib/api/action';
import { AUTH_COOKIE_BASE } from '@/lib/api/tokens';

import { canActAs, type MyCommunity } from './schema';
import { listMyCommunities } from './service';

/** The user's community accounts, for the switcher to load after the page is up. */
export async function loadMyCommunities(): Promise<ActionResult<MyCommunity[]>> {
	return listMyCommunities();
}

/**
 * Starts acting as one of the user's community accounts, or with null goes back to the user themself.
 * Every request after this carries `X-Act-As`, so the caller refreshes the page.
 */
export async function actAsCommunity(communityId: string | null): Promise<ActionResult> {
	const cookieStore = await cookies();
	if (!communityId) {
		cookieStore.delete(ACT_AS);
		return { ok: true, data: undefined };
	}
	const communities = await listMyCommunities();
	if (!communities.ok) return communities;
	const community = communities.data.find((c) => c.communityId === communityId);
	if (!community || !canActAs(community.role)) {
		return { ok: false, status: 403, errorCode: 'community.not_member', message: 'Not a member who can act as this account' };
	}
	cookieStore.set(ACT_AS, communityId, { ...AUTH_COOKIE_BASE, maxAge: REFRESH_TOKEN_EXPIRY });
	return { ok: true, data: undefined };
}
