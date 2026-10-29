/**
 * @jest-environment node
 */
import { redirect } from 'next/navigation';

import { getLoginHref, getMyProfile, redirectToLogin } from '@/data/auth';
import { ApiError, AuthError } from '@/lib/api/client';
import { getMyProfile as fetchMyProfile } from '@/lib/api/services/users';

let accessToken: string | undefined = 'token';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('react', () => ({ ...jest.requireActual('react'), cache: (fn: unknown) => fn }));
jest.mock('next/headers', () => ({
	cookies: async () => ({ get: () => (accessToken ? { value: accessToken } : undefined) }),
}));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/lib/api/auth', () => ({ decodeToken: async () => ({ sub: 'u1' }) }));
jest.mock('@/lib/api/services/users', () => ({ getMyProfile: jest.fn() }));

const mockFetch = fetchMyProfile as jest.Mock;

beforeEach(() => {
	accessToken = 'token';
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
