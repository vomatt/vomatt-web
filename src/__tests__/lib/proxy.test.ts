/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const SECRET = 'test-secret-for-proxy-test-0123456789';
process.env.SESSION_SECRET = SECRET;
process.env.API_URL = 'https://api.example.test';

 
const { proxy } = require('@/proxy') as typeof import('@/proxy');
const { tokenFingerprint } = require('@/lib/api/tokens') as typeof import('@/lib/api/tokens');

function signToken(expiresIn = '15m') {
	return new SignJWT({ sub: 'user-1' })
		.setProtectedHeader({ alg: 'HS512' })
		.setExpirationTime(expiresIn)
		.sign(new TextEncoder().encode(SECRET));
}

function refreshResponse(accessToken: string, refreshToken = 'r2', status = 200) {
	return new Response(
		JSON.stringify({ success: true, data: { token: accessToken, refreshToken } }),
		{ status, headers: { 'Content-Type': 'application/json' } }
	);
}

/** vomatt-api's answer to GET /users/me for a session it still accepts. */
function meResponse() {
	return new Response(JSON.stringify({ success: true, data: { id: 'user-1' } }), { status: 200 });
}

/** The cookies Server Components will see for this request. */
function forwardedCookies(res: Response) {
	return res.headers.get('x-middleware-request-cookie') ?? '';
}

function requestFor(path: string, cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
	const cookie = Object.entries(cookies)
		.map(([name, value]) => `${name}=${value}`)
		.join('; ');
	return new NextRequest(`http://localhost:3000${path}`, {
		headers: cookie ? { cookie, ...headers } : headers,
	});
}

const fetchMock = jest.fn();
beforeEach(() => {
	fetchMock.mockReset();
	global.fetch = fetchMock;
});

describe('proxy auth', () => {
	it('does not treat a garbage access token as a session', async () => {
		const res = await proxy(requestFor('/login', { accessToken: 'garbage' }));
		expect(res.headers.get('location')).toBeNull();
	});

	it('redirects signed-out users from protected pages to login', async () => {
		const res = await proxy(requestFor('/account'));
		expect(res.headers.get('location')).toBe(
			'http://localhost:3000/login?redirect=%2Faccount'
		);
	});

	// The first-load splash streams the page, so a redirect in the page can't send a 307
	it.each(['/settings', '/settings/devices', '/following', '/following/saved', '/results-in', '/closing-soon'])(
		'redirects signed-out users from %s to login before the page streams',
		async (path) => {
			const res = await proxy(requestFor(path));
			expect(res.headers.get('location')).toBe(
				`http://localhost:3000/login?redirect=${encodeURIComponent(path)}`
			);
		}
	);

	it('lets signed-out users view public pages', async () => {
		const res = await proxy(requestFor('/explore'));
		expect(res.headers.get('location')).toBeNull();
	});

	it('lets a valid session through to protected pages', async () => {
		const res = await proxy(
			requestFor('/account', { accessToken: await signToken() })
		);
		expect(res.headers.get('location')).toBeNull();
	});

	it('refreshes an invalid access token and sets new cookies', async () => {
		const fresh = await signToken();
		fetchMock.mockResolvedValue(refreshResponse(fresh));

		const res = await proxy(
			requestFor('/account', { accessToken: 'garbage', refreshToken: 'r1' })
		);

		expect(res.headers.get('location')).toBeNull();
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
		expect(res.cookies.get('refreshToken')?.value).toBe('r2');
	});

	it('forwards refreshed tokens to the same request, so rendering does not refresh again', async () => {
		const fresh = await signToken();
		fetchMock.mockResolvedValue(refreshResponse(fresh));

		const res = await proxy(requestFor('/', { refreshToken: 'r1' }));

		expect(forwardedCookies(res)).toContain(`accessToken=${fresh}`);
		expect(forwardedCookies(res)).toContain('refreshToken=r2');
	});

	it('refreshes an access token that is about to expire', async () => {
		const fresh = await signToken();
		fetchMock.mockResolvedValue(refreshResponse(fresh));

		const res = await proxy(
			requestFor('/', { accessToken: await signToken('30s'), refreshToken: 'r1' })
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
	});

	it('does not refresh a valid access token', async () => {
		await proxy(requestFor('/', { accessToken: await signToken(), refreshToken: 'r1' }));
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('clears a refresh token the backend rejects and says the session expired', async () => {
		fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));

		const res = await proxy(requestFor('/account', { refreshToken: 'dead' }));

		expect(res.headers.get('location')).toBe(
			'http://localhost:3000/login?redirect=%2Faccount&session_expired=1'
		);
		expect(res.cookies.get('refreshToken')?.value).toBe('');
		expect(res.cookies.get('accessToken')?.value).toBe('');
	});

	it('tells a user signed out everywhere for security why', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ success: false, errorCode: 'auth.suspicious_login' }), { status: 401 })
		);

		const res = await proxy(requestFor('/account', { refreshToken: 'reused' }));

		expect(res.headers.get('location')).toBe(
			'http://localhost:3000/login?redirect=%2Faccount&session_expired=security'
		);
		expect(res.cookies.get('refreshToken')?.value).toBe('');
	});

	it('keeps the cookies when the backend is unreachable', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		fetchMock.mockRejectedValue(new TypeError('fetch failed'));

		const res = await proxy(requestFor('/', { refreshToken: 'r1' }));

		expect(res.cookies.get('refreshToken')).toBeUndefined();
	});

	it('tells rendering the session could not be checked when the backend is unreachable', async () => {
		fetchMock.mockResolvedValue(new Response('', { status: 503 }));

		const res = await proxy(requestFor('/', { refreshToken: 'r1' }));

		expect(res.headers.get('x-middleware-request-x-session-unconfirmed')).toBe('1');
	});

	it('sends an unconfirmed session on a protected page to login without saying it expired', async () => {
		fetchMock.mockResolvedValue(new Response('', { status: 503 }));

		const res = await proxy(requestFor('/account', { refreshToken: 'r1' }));

		// No session_expired, so login sends the user back once the retry signs them in
		expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Faccount');
		expect(res.cookies.get('refreshToken')).toBeUndefined();
	});

	it('answers a session probe with 503 while the backend is unreachable', async () => {
		fetchMock.mockResolvedValue(new Response('', { status: 503 }));

		const res = await proxy(requestFor('/account', { refreshToken: 'r1' }, { 'x-session-probe': '1' }));

		expect(res.status).toBe(503);
		expect(res.headers.get('location')).toBeNull();
	});

	it('answers a session probe with 204 and the rotated cookies once refreshed', async () => {
		const fresh = await signToken();
		fetchMock.mockResolvedValue(refreshResponse(fresh));

		const res = await proxy(requestFor('/login', { refreshToken: 'r1' }, { 'x-session-probe': '1' }));

		expect(res.status).toBe(204);
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
	});

	it('marks an unconfirmed session in a cookie the page can read', async () => {
		fetchMock.mockResolvedValue(new Response('', { status: 503 }));

		const res = await proxy(requestFor('/explore', { refreshToken: 'r1' }));

		expect(res.cookies.get('session-unconfirmed')).toMatchObject({ value: '1', httpOnly: false, path: '/' });
	});

	it('clears the unconfirmed mark once the session settles', async () => {
		fetchMock.mockResolvedValue(refreshResponse(await signToken()));

		const res = await proxy(requestFor('/explore', { refreshToken: 'r1', 'session-unconfirmed': '1' }));

		expect(res.cookies.get('session-unconfirmed')?.value).toBe('');
	});

	it('does not let a browser claim the session is unconfirmed', async () => {
		const res = await proxy(requestFor('/', {}, { 'x-session-unconfirmed': '1' }));
		expect(res.headers.get('x-middleware-request-x-session-unconfirmed')).toBeNull();
	});

	it('keeps refreshed cookies when redirecting away from login', async () => {
		const fresh = await signToken();
		fetchMock.mockResolvedValue(refreshResponse(fresh));

		const res = await proxy(requestFor('/login', { refreshToken: 'r1' }));

		expect(res.headers.get('location')).toBe('http://localhost:3000/');
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
		expect(res.cookies.get('refreshToken')).toMatchObject({
			value: 'r2',
			httpOnly: true,
		});
	});

	it('sends a signed-in user on /login to the redirect target', async () => {
		fetchMock.mockResolvedValue(meResponse());
		const res = await proxy(
			requestFor('/login?redirect=%2Fpoll%2Fp1', { accessToken: await signToken() })
		);
		expect(res.headers.get('location')).toBe('http://localhost:3000/poll/p1');
	});

	it('refreshes an old-secret token after the API secret rotates', async () => {
		const oldSecretToken = await new SignJWT({ sub: 'user-1' })
			.setProtectedHeader({ alg: 'HS512' })
			.setExpirationTime('15m')
			.sign(new TextEncoder().encode('the-previous-secret-0123456789abcdef'));
		const fresh = await signToken();
		fetchMock.mockResolvedValue(refreshResponse(fresh));

		const res = await proxy(requestFor('/account', { accessToken: oldSecretToken, refreshToken: 'r1' }));

		expect(res.headers.get('location')).toBeNull();
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
	});

	it("passes the user's IP to the refresh when CLIENT_IP_SECRET is set", async () => {
		process.env.CLIENT_IP_SECRET = 'client-ip-secret-0123456789abcdef';
		try {
			fetchMock.mockResolvedValue(refreshResponse(await signToken()));
			await proxy(requestFor('/', { refreshToken: 'r1' }, { 'x-forwarded-for': '198.51.100.9, 10.0.0.1' }));
			expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
				'X-Client-IP': '198.51.100.9',
				'X-Client-IP-Secret': 'client-ip-secret-0123456789abcdef',
			});
		} finally {
			delete process.env.CLIENT_IP_SECRET;
		}
	});

	it("passes the browser's User-Agent to the refresh, which the API keeps as the session's device", async () => {
		fetchMock.mockResolvedValue(refreshResponse(await signToken()));
		await proxy(requestFor('/', { refreshToken: 'r1' }, { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' }));
		expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' });
	});

	it('stops rotating once a freshly issued token fails verification (secret mismatch)', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		const foreign = await new SignJWT({ sub: 'user-1' })
			.setProtectedHeader({ alg: 'HS512' })
			.setExpirationTime('15m')
			.sign(new TextEncoder().encode('a-different-secret-0123456789abcdef'));
		fetchMock.mockResolvedValue(refreshResponse(foreign));

		const first = await proxy(requestFor('/', { refreshToken: 'r1' }));
		expect(first.cookies.get('refreshToken')?.value).toBe('r2');
		// Only a fingerprint of the token, never the token itself, in a cookie as guarded as the auth ones
		const mark = first.cookies.get('auth-key-mismatch');
		expect(mark?.value).toBe(await tokenFingerprint('r2'));
		expect(mark).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });

		await proxy(
			requestFor('/', { accessToken: foreign, refreshToken: 'r2', 'auth-key-mismatch': mark!.value })
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('lets a session the API rejected open the login page', async () => {
		const res = await proxy(
			requestFor('/login?redirect=%2Fpoll%2Fp1&session_expired=1', { accessToken: await signToken() })
		);
		expect(res.headers.get('location')).toBeNull();
	});

	it('redirects a signed-in user away from login', async () => {
		fetchMock.mockResolvedValue(meResponse());
		const res = await proxy(requestFor('/login', { accessToken: await signToken() }));
		expect(res.headers.get('location')).toBe('http://localhost:3000/');
	});

	it('opens login for a session signed out from another device, and clears its cookies', async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ success: false, errorCode: 'auth.session_revoked' }), { status: 401 })
		);

		const res = await proxy(requestFor('/login', { accessToken: await signToken(), refreshToken: 'r1' }));

		expect(res.headers.get('location')).toBeNull();
		expect(res.cookies.get('accessToken')?.value).toBe('');
		expect(res.cookies.get('refreshToken')?.value).toBe('');
		expect(forwardedCookies(res)).not.toContain('accessToken=');
	});

	it.each([
		['the API cannot answer', () => Promise.reject(new TypeError('fetch failed'))],
		['the token is refused for another reason', () =>
			Promise.resolve(new Response(JSON.stringify({ errorCode: 'auth.token.expired' }), { status: 401 }))],
	])('keeps the session and leaves login when %s', async (_, reply) => {
		fetchMock.mockImplementation(reply);
		const res = await proxy(requestFor('/login', { accessToken: await signToken(), refreshToken: 'r1' }));
		expect(res.headers.get('location')).toBe('http://localhost:3000/');
		expect(res.cookies.get('refreshToken')).toBeUndefined();
	});

	it('asks the API about a session only when a page load of login would send it away', async () => {
		const accessToken = await signToken();
		await proxy(requestFor('/', { accessToken, refreshToken: 'r1' }));
		await proxy(new NextRequest('http://localhost:3000/login', { method: 'POST', headers: { cookie: `accessToken=${accessToken}` } }));
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('proxy matcher', () => {
	const { config } = require('@/proxy') as typeof import('@/proxy');
	const matches = (path: string) => config.matcher.some((source) => new RegExp(`^${source}$`).test(path));

	it('skips the API routes', () => {
		expect(matches('/api/revalidate')).toBe(false);
	});

	it('runs for a profile whose username starts with "api"', () => {
		expect(matches('/apiary')).toBe(true);
	});
});

describe('proxy language', () => {
	const languageFor = async (acceptLanguage?: string, cookies: Record<string, string> = {}) => {
		const res = await proxy(requestFor('/', cookies, acceptLanguage ? { 'accept-language': acceptLanguage } : {}));
		return res.cookies.get('preferred-language')?.value;
	};

	it.each([
		['zh-TW,zh;q=0.9,en;q=0.8', 'zh'],
		['zh-CN', 'zh'],
		['en-US,en;q=0.9', 'en'],
		// The highest q wins, whatever the order
		['en;q=0.5,zh-TW;q=0.9', 'zh'],
		['fr-FR,zh;q=0.4,en;q=0.2', 'zh'],
		['en;q=0,zh;q=0.1', 'zh'],
		['fr,de', 'en'],
		['*', 'en'],
		[undefined, 'en'],
	])('picks the language for Accept-Language %s', async (header, language) => {
		expect(await languageFor(header)).toBe(language);
	});

	it('leaves a language the visitor already chose', async () => {
		expect(await languageFor('zh-TW', { 'preferred-language': 'en' })).toBeUndefined();
	});
});
