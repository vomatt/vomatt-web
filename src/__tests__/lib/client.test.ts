/**
 * @jest-environment node
 */
process.env.API_URL = 'https://api.example.test';

const mockGetTokens = jest.fn();
jest.mock('@/lib/api/auth', () => ({
	getTokens: () => mockGetTokens(),
}));
const mockLocale = jest.fn();
jest.mock('@/lib/getServerLocale', () => ({
	getServerLocale: () => mockLocale(),
}));

 
const { apiClient, ApiError, AuthError } = require('@/lib/api/client') as typeof import('@/lib/api/client');

const fetchMock = jest.fn();
beforeEach(() => {
	jest.clearAllMocks();
	mockLocale.mockResolvedValue({ language: 'en', payloadLocale: 'en' });
	global.fetch = fetchMock;
});

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('apiClient', () => {
	it('sends the access token and unwraps the envelope', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		fetchMock.mockResolvedValue(json({ success: true, data: { id: 'x' } }));

		await expect(apiClient('/users/me')).resolves.toEqual({ id: 'x' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.example.test/api/users/me');
		expect(new Headers(init.headers).get('Authorization')).toBe('Bearer a1');
	});

	it('asks for messages in the viewer\'s language', async () => {
		mockGetTokens.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' });
		mockLocale.mockResolvedValue({ language: 'zh', payloadLocale: 'zh' });
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
