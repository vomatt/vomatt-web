/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const SECRET = 'test-secret-for-proxy-test-0123456789';
process.env.SESSION_SECRET = SECRET;
process.env.API_URL = 'https://api.example.test';

 
const { proxy } = require('@/proxy') as typeof import('@/proxy');

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

/** The cookies Server Components will see for this request. */
function forwardedCookies(res: Response) {
	return res.headers.get('x-middleware-request-cookie') ?? '';
}

function requestFor(path: string, cookies: Record<string, string> = {}) {
	const cookie = Object.entries(cookies)
		.map(([name, value]) => `${name}=${value}`)
		.join('; ');
	return new NextRequest(`http://localhost:3000${path}`, {
		headers: cookie ? { cookie } : {},
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

	it('keeps the cookies when the backend is unreachable', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		fetchMock.mockRejectedValue(new TypeError('fetch failed'));

		const res = await proxy(requestFor('/', { refreshToken: 'r1' }));

		expect(res.cookies.get('refreshToken')).toBeUndefined();
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

	it('stops rotating once a freshly issued token fails verification (secret mismatch)', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		const foreign = await new SignJWT({ sub: 'user-1' })
			.setProtectedHeader({ alg: 'HS512' })
			.setExpirationTime('15m')
			.sign(new TextEncoder().encode('a-different-secret-0123456789abcdef'));
		fetchMock.mockResolvedValue(refreshResponse(foreign));

		const first = await proxy(requestFor('/', { refreshToken: 'r1' }));
		expect(first.cookies.get('refreshToken')?.value).toBe('r2');
		expect(first.cookies.get('auth-key-mismatch')?.value).toBe('r2');

		await proxy(
			requestFor('/', { accessToken: foreign, refreshToken: 'r2', 'auth-key-mismatch': 'r2' })
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('lets a session the API rejected open the login page', async () => {
		const res = await proxy(
			requestFor('/login?redirect=%2Fpoll%2Fp1&session_expired=1', { accessToken: await signToken() })
		);
		expect(res.headers.get('location')).toBeNull();
	});

	it('redirects a signed-in user away from signup', async () => {
		const res = await proxy(requestFor('/signup', { accessToken: await signToken() }));
		expect(res.headers.get('location')).toBe('http://localhost:3000/');
	});
});
