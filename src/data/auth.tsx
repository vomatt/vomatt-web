import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { ACCESS_TOKEN } from '@/data/constants';
import { canActAs, type CommunityRole, type MyCommunity } from '@/features/communities/schema';
import { listMyCommunities } from '@/features/communities/service';
import { decodeToken, getActingCommunityId } from '@/lib/api/auth';
import { apiClient, ApiError, AuthError } from '@/lib/api/client';
import { getMyProfile as fetchMyProfile } from '@/lib/api/services/users';
import { loginHref } from '@/lib/routes';
import { MyProfile } from '@/types/user';

export interface Session {
	/** The user id. */
	sub: string;
	exp?: number;
	iat?: number;
}

// Cached helper methods makes it easy to get the same value in many places
// without manually passing it around. This discourages passing it from Server
// Component to Server Component which minimizes risk of passing it to a Client
// Component.
// Token refresh on expiry is handled in middleware (proxy.tsx) before this runs,
// so by the time these are called the access token cookie is always fresh.

/**
 * The access token's claims. A token signed out from another device still verifies until it expires, so this
 * doesn't say the visitor is signed in: anything that shows signed-in state uses getUserSession.
 */
export const getTokenSession = cache(async (): Promise<Session | null> => {
	const accessTokenCookie = (await cookies()).get(ACCESS_TOKEN);
	if (accessTokenCookie?.value) {
		const payload = await decodeToken(accessTokenCookie.value);
		if (payload?.sub) {
			return { sub: payload.sub, exp: payload.exp, iat: payload.iat };
		}
	}
	return null;
});

/**
 * The signed-in user's profile; `gone` when the token is live but its account was deleted elsewhere.
 * `error` when the API couldn't answer (down, rate limited): the visitor may well be signed in.
 */
export const loadMyProfile = cache(
	async (): Promise<{ profile: MyProfile | null; gone?: true; revoked?: true; error?: unknown }> => {
		const session = await getTokenSession();
		if (!session) return { profile: null };

		try {
			return { profile: await fetchMyProfile() };
		} catch (error) {
			if (error instanceof AuthError) {
				return error.errorCode === 'auth.session_revoked' ? { profile: null, revoked: true } : { profile: null };
			}
			// Signed out, not a broken page
			if (error instanceof ApiError && error.data?.errorCode === 'user.not_found') return { profile: null, gone: true };
			return { profile: null, error };
		}
	}
);

/**
 * The signed-in user: a token the API refused (signed out from another device, account deleted) is no session.
 * While the API can't answer, the token stands; the layout waits on SessionRetry.
 * While acting as a community account, `sub` is the account's id, so it owns the polls and comments posted as it.
 */
export const getUserSession = cache(async (): Promise<Session | null> => {
	const [session, { profile, error }] = await Promise.all([getTokenSession(), loadMyProfile()]);
	if (session && profile) return { ...session, sub: profile.id };
	return error ? session : null;
});

/** A community account being acted as; `role` is null when the list of the user's accounts couldn't load. */
export type ActingAccount = Omit<MyCommunity, 'role'> & { role: CommunityRole | null };

/** Who the signed-in user is and may act as; `stale` when the cookie names an account they can no longer act as. */
export type ActingState = {
	acting: ActingAccount | null;
	/** The person behind it, for the switcher's own row; null when it couldn't load. */
	me: Pick<MyProfile, 'username' | 'displayName' | 'avatarUrl'> | null;
	/** The user's community accounts; null when not fetched here (the switcher loads them itself). */
	communities: MyCommunity[] | null;
	stale: boolean;
};

/** The user's community accounts, fetched once per request: the layout and the members page both need them. */
export const getMyCommunities = cache(listMyCommunities);

const NOT_SIGNED_IN: ActingState = { acting: null, me: null, communities: [], stale: false };

/**
 * Acting state for the layout. Most users act as nobody: for them it costs nothing beyond the profile, and the
 * sidebar switcher loads their community accounts in the background. Only a set cookie is checked here.
 */
export const loadActingState = cache(async (): Promise<ActingState> => {
	const [token, actingId] = await Promise.all([getTokenSession(), getActingCommunityId()]);
	if (!token) return NOT_SIGNED_IN;
	if (!actingId) {
		const { profile } = await loadMyProfile();
		return profile ? { acting: null, me: profile, communities: null, stale: false } : NOT_SIGNED_IN;
	}
	const [{ profile }, result, person] = await Promise.all([
		loadMyProfile(),
		getMyCommunities(),
		apiClient<MyProfile>('/users/me', { actAs: false }).catch(() => null),
	]);
	if (!profile) return NOT_SIGNED_IN;
	if (!result.ok) {
		// Requests still go out as the account, so the banner stays up; its role is unknown until the list loads
		const acting = actingFromProfile(profile, actingId);
		return { acting, me: acting ? person : profile, communities: null, stale: false };
	}
	const acting = result.data.find((c) => c.communityId === actingId && canActAs(c.role)) ?? null;
	return { acting, me: acting ? person : profile, communities: result.data, stale: !acting };
});

/** The account being acted as, read off its own profile (the one `/users/me` answers with while acting). */
function actingFromProfile(profile: MyProfile, actingId: string): ActingAccount | null {
	if (!profile.community || profile.id !== actingId) return null;
	const { username, displayName, avatarUrl } = profile;
	return { communityId: actingId, username, displayName, avatarUrl, role: null };
}

/** Throws when the API couldn't answer: treating that as signed out would send a signed-in user to log in. */
export const getMyProfile = async (): Promise<MyProfile | null> => {
	const { profile, error } = await loadMyProfile();
	if (error) throw error;
	return profile;
};

/**
 * The login link for this visitor. A token the API refused still verifies in the proxy, which asks the API only
 * about revocation before sending a plain /login back; `session_expired` lets any refused token through.
 */
export async function getLoginHref(redirect?: string): Promise<string> {
	const [session, { profile, gone, revoked }] = await Promise.all([getTokenSession(), loadMyProfile()]);
	return loginHref({
		redirect,
		sessionExpired: gone ? 'deleted' : revoked ? 'revoked' : session && !profile ? '1' : undefined,
	});
}

/** Sends a visitor with no profile to sign in. */
export async function redirectToLogin(path: string): Promise<never> {
	redirect(await getLoginHref(path));
}
