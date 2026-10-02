/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';

const SECRET = 'test-secret-for-tokens-test-0123456789';
process.env.SESSION_SECRET = SECRET;
process.env.API_URL = 'https://api.example.test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tokens = require('@/lib/api/tokens') as typeof import('@/lib/api/tokens');

function signToken(expiresIn: string, secret = SECRET) {
	return new SignJWT({ sub: 'user-1', username: 'alice' })
		.setProtectedHeader({ alg: 'HS512' })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(new TextEncoder().encode(secret));
}

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

const fetchMock = jest.fn();
beforeEach(() => {
	fetchMock.mockReset();
	global.fetch = fetchMock;
});

describe('verifyAccessToken', () => {
	it('returns the payload for a valid token', async () => {
		const payload = await tokens.verifyAccessToken(await signToken('15m'));
		expect(payload?.username).toBe('alice');
	});

	it('returns null for a garbage token', async () => {
		expect(await tokens.verifyAccessToken('not-a-jwt')).toBeNull();
	});

	it('returns null for a token signed with another secret', async () => {
		const forged = await signToken('15m', 'some-other-secret-0123456789');
		expect(await tokens.verifyAccessToken(forged)).toBeNull();
	});

	it('returns null for an expired token', async () => {
		const expired = await signToken('-1m');
		expect(await tokens.verifyAccessToken(expired)).toBeNull();
	});
});

describe('requestTokenRefresh', () => {
	it('shares one request between concurrent callers', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({ accessToken: 'a2', refreshToken: 'r2' })
		);

		const [first, second] = await Promise.all([
			tokens.requestTokenRefresh('r1'),
			tokens.requestTokenRefresh('r1'),
		]);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(first).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
		expect(second).toBe(first);
	});

	it('accepts `token` as the access token field', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ token: 'a2', refreshToken: 'r2' }));
		expect((await tokens.requestTokenRefresh('r1'))?.accessToken).toBe('a2');
	});

	it('keeps the current refresh token when the backend does not rotate it', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ accessToken: 'a2' }));
		expect((await tokens.requestTokenRefresh('r1'))?.refreshToken).toBe('r1');
	});

	it('returns null when the backend rejects the refresh token', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false }, 401));
		expect(await tokens.requestTokenRefresh('r1')).toBeNull();
	});
});

describe('buildAuthCookies', () => {
	it('expires the access cookie with the token', async () => {
		const accessToken = await signToken('15m');
		const [access] = tokens.buildAuthCookies({
			accessToken,
			refreshToken: 'r1',
		});
		const minutesLeft = (access.options.expires.getTime() - Date.now()) / 60000;
		expect(minutesLeft).toBeGreaterThan(14);
		expect(minutesLeft).toBeLessThanOrEqual(15);
	});
});
