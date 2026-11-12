/**
 * @jest-environment node
 */
import { json } from '@/__tests__/helpers/jsonResponse';

process.env.API_URL = 'https://api.example.test';

const mockGetTokens = jest.fn();
const mockActingId = jest.fn();
jest.mock('@/lib/api/auth', () => ({
	getTokens: () => mockGetTokens(),
	getActingCommunityId: () => mockActingId(),
}));
let mockRequestHeaders = new Headers();
const mockDeleteCookie = jest.fn();
jest.mock('next/headers', () => ({
	headers: async () => mockRequestHeaders,
	cookies: async () => ({ delete: mockDeleteCookie }),
}));
const mockLocale = jest.fn();
jest.mock('@/lib/getServerLocale', () => ({
	getServerLocale: () => mockLocale(),
}));

 
const { apiClient, ApiError, AuthError } = require('@/lib/api/client') as typeof import('@/lib/api/client');

const fetchMock = jest.fn();
beforeEach(() => {
	jest.clearAllMocks();
	mockRequestHeaders = new Headers();
	delete process.env.CLIENT_IP_SECRET;
	mockLocale.mockResolvedValue({ language: 'en', localeTag: 'en' });
	mockActingId.mockResolvedValue(null);
	global.fetch = fetchMock;
});

describe('apiClient', () => {
	it('sends the access token and unwraps the envelope', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(json({ success: true, data: { id: 'x' } }));

		await expect(apiClient('/users/me')).resolves.toEqual({ id: 'x' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/users/me');
		expect(new Headers(init.headers).get('Authorization')).toBe('Bearer a1');
	});

	it("passes the user's IP when CLIENT_IP_SECRET is set", async () => {
		process.env.CLIENT_IP_SECRET = 'client-ip-secret-0123456789abcdef';
		mockRequestHeaders = new Headers({ 'x-forwarded-for': '198.51.100.9' });
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(json({ success: true, data: null }));

		await apiClient('/votes/v1/vote', { method: 'POST' });
		const headers = new Headers(fetchMock.mock.calls[0][1].headers);
		expect(headers.get('X-Client-IP')).toBe('198.51.100.9');
		expect(headers.get('X-Client-IP-Secret')).toBe('client-ip-secret-0123456789abcdef');
	});

	it('asks for messages in the viewer\'s language', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		mockLocale.mockResolvedValue({ language: 'zh', localeTag: 'zh-TW' });
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient('/votes', { method: 'POST' });
		expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Accept-Language')).toBe('zh-TW');
	});

	it('reads Retry-After from a 429', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ success: false, errorCode: 'common.rate_limited' }), {
				status: 429,
				headers: { 'Content-Type': 'application/json', 'Retry-After': '42' },
			})
		);

		await expect(apiClient('/votes')).rejects.toMatchObject({ statusCode: 429, retryAfter: 42 });
	});

	it('keeps a signed-in response out of the shared cache', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient('/votes/1', { auth: 'optional', next: { tags: ['poll:1'] } } as RequestInit);
		const init = fetchMock.mock.calls[0][1];
		expect(init.cache).toBe('no-store');
		expect(init).not.toHaveProperty('next');
	});

	it('throws AuthError on 401 without trying to refresh (only the proxy rotates tokens)', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(json({ success: false }, 401));

		await expect(apiClient('/users/me')).rejects.toBeInstanceOf(AuthError);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('carries the errorCode of a 401, so a revoked session is told from an expired one', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(json({ success: false, errorCode: 'auth.session_revoked' }, 401));

		await expect(apiClient('/users/me')).rejects.toMatchObject({ errorCode: 'auth.session_revoked' });
	});

	it('throws AuthError when signed out and auth is required', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: '', refreshToken: 'r1' });
		await expect(apiClient('/users/me')).rejects.toBeInstanceOf(AuthError);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('falls back to a public request when auth is optional', async () => {
		mockGetTokens.mockResolvedValue(null);
		fetchMock.mockResolvedValue(json({ success: true, data: [] }));

		await apiClient('/votes/1', { auth: 'optional' });
		expect(new Headers(fetchMock.mock.calls[0][1].headers).has('Authorization')).toBe(false);
	});

	it('carries the backend errorCode on ApiError', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(json({ success: false, errorCode: 'vote.not_allowed', message: 'closed' }, 400));

		const error = await apiClient('/votes/1/vote', { method: 'POST' }).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect((error as InstanceType<typeof ApiError>).data.errorCode).toBe('vote.not_allowed');
	});
});

describe('apiClient while acting as a community', () => {
	const notMember = () =>
		new Response(JSON.stringify({ success: false, errorCode: 'community.not_member' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' },
		});
	const actAs = (call: number) => new Headers(fetchMock.mock.calls[call][1].headers).get('X-Act-As');

	beforeEach(() => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		mockActingId.mockResolvedValue('c1');
	});

	it('sends X-Act-As with the community id', async () => {
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient('/votes', { method: 'POST' });
		expect(actAs(0)).toBe('c1');
	});

	it('leaves the header off when the caller asks for the real user', async () => {
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient('/users/me', { actAs: false });
		expect(actAs(0)).toBeNull();
	});

	it('reads as the real user once the membership is gone', async () => {
		fetchMock.mockResolvedValueOnce(notMember()).mockResolvedValueOnce(json({ success: true, data: { id: 'u1' } }));

		await expect(apiClient('/users/me')).resolves.toEqual({ id: 'u1' });
		expect(actAs(0)).toBe('c1');
		expect(actAs(1)).toBeNull();
	});

	it('never retries a write as the real user', async () => {
		fetchMock.mockResolvedValue(notMember());

		await expect(apiClient('/votes', { method: 'POST' })).rejects.toMatchObject({ statusCode: 403 });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('ends acting when a write finds the membership gone', async () => {
		fetchMock.mockResolvedValue(notMember());

		await expect(apiClient('/votes', { method: 'POST' })).rejects.toMatchObject({ statusCode: 403 });
		expect(mockDeleteCookie).toHaveBeenCalledWith('actAs');
	});

	it('still refuses the write when the cookie is read-only (a page rendering)', async () => {
		fetchMock.mockResolvedValue(notMember());
		mockDeleteCookie.mockImplementationOnce(() => {
			throw new Error('Cookies can only be modified in a Server Action or Route Handler');
		});

		await expect(apiClient('/votes', { method: 'POST' })).rejects.toMatchObject({ statusCode: 403 });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('keeps acting when a read finds the membership gone (the layout ends it)', async () => {
		fetchMock.mockResolvedValueOnce(notMember()).mockResolvedValueOnce(json({ success: true, data: {} }));

		await apiClient('/users/me');
		expect(mockDeleteCookie).not.toHaveBeenCalled();
	});

	it.each([
		['GET', '/users/me/sessions'],
		['DELETE', '/users/me/sessions?scope=others'],
		['GET', '/users/me/passkeys'],
		['POST', '/auth/passkey/register/options'],
		['POST', '/users/me/phone/send-otp'],
		['GET', '/users/me/export'],
		['DELETE', '/users/u1'],
	])("sends the person's own %s %s as the person", async (method, endpoint) => {
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient(endpoint, { method });
		expect(actAs(0)).toBeNull();
	});

	it.each([
		['PATCH', '/communities/c2'],
		['PUT', '/communities/c1/avatar'],
		['GET', '/communities/c2/members'],
	])('sends %s %s, which names its account, as the person', async (method, endpoint) => {
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient(endpoint, { method });
		expect(actAs(0)).toBeNull();
	});

	it('keeps acting when a write to another account finds the user isn’t its member', async () => {
		fetchMock.mockResolvedValue(notMember());

		await expect(apiClient('/communities/c2', { method: 'PATCH' })).rejects.toMatchObject({ statusCode: 403 });
		expect(mockDeleteCookie).not.toHaveBeenCalled();
	});

	it('acts as the community when creating one', async () => {
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient('/communities', { method: 'POST' });
		expect(actAs(0)).toBe('c1');
	});

	it.each([
		['DELETE', '/users/me/follows/u2'],
		['PATCH', '/users/me'],
		['DELETE', '/votes/v1'],
	])('acts as the community on %s %s', async (method, endpoint) => {
		fetchMock.mockResolvedValue(json({ success: true, data: {} }));

		await apiClient(endpoint, { method });
		expect(actAs(0)).toBe('c1');
	});
});
