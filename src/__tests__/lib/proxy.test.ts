/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const SECRET = 'test-secret-for-proxy-test-0123456789';
process.env.SESSION_SECRET = SECRET;
process.env.API_URL = 'https://api.example.test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { proxy } = require('@/proxy') as typeof import('@/proxy');

function signToken() {
	return new SignJWT({ sub: 'user-1' })
		.setProtectedHeader({ alg: 'HS512' })
		.setExpirationTime('15m')
		.sign(new TextEncoder().encode(SECRET));
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
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ accessToken: fresh, refreshToken: 'r2' }), {
				status: 200,
			})
		);

		const res = await proxy(
			requestFor('/account', { accessToken: 'garbage', refreshToken: 'r1' })
		);

		expect(res.headers.get('location')).toBeNull();
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
		expect(res.cookies.get('refreshToken')?.value).toBe('r2');
	});

	it('keeps refreshed cookies when redirecting away from login', async () => {
		const fresh = await signToken();
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ accessToken: fresh, refreshToken: 'r2' }), {
				status: 200,
			})
		);

		const res = await proxy(requestFor('/login', { refreshToken: 'r1' }));

		expect(res.headers.get('location')).toBe('http://localhost:3000/');
		expect(res.cookies.get('accessToken')?.value).toBe(fresh);
		expect(res.cookies.get('refreshToken')).toMatchObject({
			value: 'r2',
			httpOnly: true,
		});
	});
});
