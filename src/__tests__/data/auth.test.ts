/**
 * @jest-environment node
 */
import { redirect } from 'next/navigation';

import { getLoginHref, getMyProfile, getUserSession, loadActingState, loadMyProfile, redirectToLogin } from '@/data/auth';
import { listMyCommunities } from '@/features/communities/service';
import { apiClient, ApiError, AuthError } from '@/lib/api/client';
import { getMyProfile as fetchMyProfile } from '@/lib/api/services/users';

let accessToken: string | undefined = 'token';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({ ...jest.requireActual('react'), cache: (fn: unknown) => fn }));
jest.mock('next/headers', () => ({
	cookies: async () => ({ get: () => (accessToken ? { value: accessToken } : undefined) }),
}));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
let actingId: string | null = null;
jest.mock('@/lib/api/auth', () => ({ decodeToken: async () => ({ sub: 'u1' }), getActingCommunityId: async () => actingId }));
jest.mock('@/features/communities/service', () => ({ listMyCommunities: jest.fn() }));
jest.mock('@/lib/api/client', () => ({ ...jest.requireActual('@/lib/api/client'), apiClient: jest.fn() }));
jest.mock('@/lib/api/services/users', () => ({ getMyProfile: jest.fn() }));

const mockFetch = fetchMyProfile as jest.Mock;

beforeEach(() => {
	accessToken = 'token';
	actingId = null;
	jest.clearAllMocks();
});

it('treats a session whose account is gone as signed out', async () => {
	mockFetch.mockRejectedValue(new ApiError('User not found', 404, { errorCode: 'user.not_found' }));
	await expect(getMyProfile()).resolves.toBeNull();
});

it('still surfaces other failures', async () => {
	mockFetch.mockRejectedValue(new ApiError('Boom', 500, { errorCode: null }));
	await expect(getMyProfile()).rejects.toThrow('Boom');
});

it.each([
	['a server error', new ApiError('Boom', 500, { errorCode: null })],
	['rate limiting', new ApiError('Too many requests', 429, { errorCode: null }, 30)],
	['a network failure', new TypeError('fetch failed')],
])('reports %s as unavailable instead of throwing', async (_, error) => {
	mockFetch.mockRejectedValue(error);
	await expect(loadMyProfile()).resolves.toEqual({ profile: null, error });
});

it('sends a visitor with no session to sign in', async () => {
	accessToken = undefined;
	await redirectToLogin('/settings');
	expect(redirect).toHaveBeenCalledWith('/login?redirect=%2Fsettings');
});

it('marks a session the API refused as expired, so login does not bounce it back', async () => {
	mockFetch.mockRejectedValue(new AuthError('Unauthorized'));
	await redirectToLogin('/settings');
	expect(redirect).toHaveBeenCalledWith('/login?redirect=%2Fsettings&session_expired=1');
});

it('tells a session whose account was deleted that it is gone', async () => {
	mockFetch.mockRejectedValue(new ApiError('User not found', 404, { errorCode: 'user.not_found' }));
	await redirectToLogin('/settings');
	expect(redirect).toHaveBeenCalledWith('/login?redirect=%2Fsettings&session_expired=deleted');
});

it('gives a signed-in user a plain login link', async () => {
	mockFetch.mockResolvedValue({ id: 'u1', username: 'mei' });
	await expect(getLoginHref()).resolves.toBe('/login');
});

it('counts no session for a token the API signed out from another device', async () => {
	mockFetch.mockRejectedValue(new AuthError('Signed out', 401, 'auth.session_revoked'));
	await expect(getUserSession()).resolves.toBeNull();
});

it('keeps the session the API accepts', async () => {
	mockFetch.mockResolvedValue({ id: 'u1', username: 'mei' });
	await expect(getUserSession()).resolves.toMatchObject({ sub: 'u1' });
});

it('keeps the session while the API cannot answer, so a signed-in user is not shown signed out', async () => {
	mockFetch.mockRejectedValue(new ApiError('Boom', 500, { errorCode: null }));
	await expect(getUserSession()).resolves.toMatchObject({ sub: 'u1' });
});

it('sends a session signed out from another device to login saying so', async () => {
	mockFetch.mockRejectedValue(new AuthError('Signed out', 401, 'auth.session_revoked'));
	await redirectToLogin('/following');
	expect(redirect).toHaveBeenCalledWith('/login?redirect=%2Ffollowing&session_expired=revoked');
});

describe('acting as a community account', () => {
	const community = { communityId: 'c1', username: 'tower', displayName: 'Tower', avatarUrl: null, role: 'EDITOR' as const };
	const me = { id: 'u1', username: 'klaus', displayName: 'Klaus', avatarUrl: null };

	it("makes the session the community's, so it owns what it posts", async () => {
		actingId = 'c1';
		mockFetch.mockResolvedValue({ id: 'c1', username: 'tower' });
		await expect(getUserSession()).resolves.toMatchObject({ sub: 'c1' });
	});

	it('names the account and the person behind it', async () => {
		actingId = 'c1';
		mockFetch.mockResolvedValue({ id: 'c1', username: 'tower' });
		(listMyCommunities as jest.Mock).mockResolvedValue({ ok: true, data: [community] });
		(apiClient as jest.Mock).mockResolvedValue(me);

		await expect(loadActingState()).resolves.toEqual({ acting: community, me, communities: [community], stale: false });
		expect(apiClient).toHaveBeenCalledWith('/users/me', { actAs: false });
	});

	it('leaves the list to the switcher for someone acting as nobody', async () => {
		mockFetch.mockResolvedValue(me);

		await expect(loadActingState()).resolves.toEqual({ acting: null, me, communities: null, stale: false });
		expect(listMyCommunities).not.toHaveBeenCalled();
	});

	it('is stale once the user is no longer a member', async () => {
		actingId = 'c1';
		mockFetch.mockResolvedValue(me);
		(listMyCommunities as jest.Mock).mockResolvedValue({ ok: true, data: [] });

		await expect(loadActingState()).resolves.toMatchObject({ acting: null, stale: true });
	});

	it('is stale for an analyst, who has nothing to do as the account yet', async () => {
		actingId = 'c1';
		mockFetch.mockResolvedValue(me);
		(listMyCommunities as jest.Mock).mockResolvedValue({ ok: true, data: [{ ...community, role: 'ANALYST' }] });

		await expect(loadActingState()).resolves.toMatchObject({ acting: null, stale: true });
	});

	it('keeps acting, role unknown, when the list fails to load', async () => {
		actingId = 'c1';
		mockFetch.mockResolvedValue({ id: 'c1', username: 'tower', displayName: 'Tower', avatarUrl: null, community: true });
		(listMyCommunities as jest.Mock).mockResolvedValue({ ok: false, message: 'down' });
		(apiClient as jest.Mock).mockResolvedValue(me);

		await expect(loadActingState()).resolves.toEqual({
			acting: { communityId: 'c1', username: 'tower', displayName: 'Tower', avatarUrl: null, role: null },
			me,
			communities: null,
			stale: false,
		});
	});
});
