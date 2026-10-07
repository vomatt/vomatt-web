/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';

const SECRET = 'test-secret-for-tokens-test-0123456789';
process.env.SESSION_SECRET = SECRET;
process.env.API_URL = 'https://api.example.test';

 
const tokens = require('@/lib/api/tokens') as typeof import('@/lib/api/tokens');

function signToken(expiresIn: string, secret = SECRET) {
	return new SignJWT({ sub: 'user-1', email: 'alice@example.com' })
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
		expect(payload?.sub).toBe('user-1');
	});

	it.each(['HS256', 'HS384', 'HS512'])('accepts %s, which the backend picks by secret length', async (alg) => {
		const token = await new SignJWT({ sub: 'user-1' })
			.setProtectedHeader({ alg })
			.setExpirationTime('15m')
			.sign(new TextEncoder().encode(SECRET));
		expect(await tokens.verifyAccessToken(token)).not.toBeNull();
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

describe('isExpiringSoon', () => {
	it('is true inside the refresh leeway', () => {
		const now = Date.now();
		expect(tokens.isExpiringSoon({ exp: Math.floor(now / 1000) + 30 }, now)).toBe(true);
	});

	it('is false with time to spare', () => {
		const now = Date.now();
		expect(tokens.isExpiringSoon({ exp: Math.floor(now / 1000) + 600 }, now)).toBe(false);
	});
});

describe('requestTokenRefresh', () => {
	const envelope = (data: unknown) => ({ success: true, data });

	it('posts to /api/auth/refresh and reads the ApiResponse envelope', async () => {
		fetchMock.mockResolvedValue(jsonResponse(envelope({ token: 'a2', refreshToken: 'r2' })));

		const result = await tokens.requestTokenRefresh('r1');

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.test/api/auth/refresh',
			expect.objectContaining({ method: 'POST', body: JSON.stringify({ refreshToken: 'r1' }) })
		);
		expect(result).toEqual({ status: 'ok', tokens: { accessToken: 'a2', refreshToken: 'r2' } });
	});

	it('shares one request between concurrent callers, so a rotated token is never reused', async () => {
		fetchMock.mockResolvedValue(jsonResponse(envelope({ token: 'a2', refreshToken: 'r2' })));

		const [first, second] = await Promise.all([
			tokens.requestTokenRefresh('r1'),
			tokens.requestTokenRefresh('r1'),
		]);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(second).toBe(first);
	});

	it('is rejected when the backend refuses the refresh token', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false, errorCode: 'auth.refresh_token.invalid' }, 401));
		expect(await tokens.requestTokenRefresh('r1')).toEqual({ status: 'rejected' });
	});

	it('is unavailable when the backend errors, so the session is kept', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ success: false }, 503));
		expect(await tokens.requestTokenRefresh('r1')).toEqual({ status: 'unavailable' });
	});

	it('is unavailable when the network fails', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		fetchMock.mockRejectedValue(new TypeError('fetch failed'));
		expect(await tokens.requestTokenRefresh('r1')).toEqual({ status: 'unavailable' });
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

	it('keeps the refresh cookie for the backend\'s 30 days, httpOnly', async () => {
		const [, refresh] = tokens.buildAuthCookies({ accessToken: await signToken('15m'), refreshToken: 'r1' });
		const days = (refresh.options.expires.getTime() - Date.now()) / 86_400_000;
		expect(Math.round(days)).toBe(30);
		expect(refresh.options.httpOnly).toBe(true);
	});
});
