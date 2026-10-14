/**
 * @jest-environment node
 */
import { json } from '@/__tests__/helpers/jsonResponse';
import { backendFetch } from '@/lib/api/backend-fetch';

const fetchMock = jest.fn();
const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const env = process.env as Record<string, string | undefined>;
const originalEnv = env.NODE_ENV;

beforeEach(() => {
	jest.clearAllMocks();
	global.fetch = fetchMock;
});
afterEach(() => {
	delete env.API_LOG;
});
afterAll(() => {
	env.NODE_ENV = originalEnv;
	logSpy.mockRestore();
});

// The response is logged once a copy of its body has been read
const flushLogs = () => new Promise((resolve) => setImmediate(resolve));
// Without color codes, so assertions read like the terminal does
const logged = () =>
	logSpy.mock.calls
		.map((args) => args.join(' '))
		.join('\n')
		.replace(/\x1b\[\d+m/g, '');

describe('backendFetch', () => {
	it('logs nothing outside development', async () => {
		env.NODE_ENV = 'production';
		fetchMock.mockResolvedValue(json({ data: { id: 'x' } }));

		await backendFetch('https://api.test/api/polls');
		await flushLogs();

		expect(logSpy).not.toHaveBeenCalled();
	});

	it('logs outside development when API_LOG=1', async () => {
		env.NODE_ENV = 'production';
		env.API_LOG = '1';
		fetchMock.mockResolvedValue(json({ data: { id: 'x' } }));

		await backendFetch('https://api.test/api/polls');
		await flushLogs();

		expect(logged()).toContain('GET https://api.test/api/polls → 200');
	});

	it('logs nothing when API_LOG=0', async () => {
		env.NODE_ENV = 'development';
		env.API_LOG = '0';
		fetchMock.mockResolvedValue(json({ data: 1 }));

		await backendFetch('https://api.test/api/x');
		await flushLogs();

		expect(logSpy).not.toHaveBeenCalled();
	});

	it('logs the request and response in development', async () => {
		env.NODE_ENV = 'development';
		fetchMock.mockResolvedValue(json({ data: { id: 'x' } }, 201));

		await backendFetch('https://api.test/api/polls', {
			method: 'POST',
			body: JSON.stringify({ title: 'Cats?' }),
		});
		await flushLogs();

		expect(logged()).toContain('POST https://api.test/api/polls → 201');
		expect(logged()).toContain('"title": "Cats?"');
		expect(logged()).toContain('"id": "x"');
	});

	it('hides tokens in headers and bodies', async () => {
		env.NODE_ENV = 'development';
		fetchMock.mockResolvedValue(
			json({
				data: {
					token: 'a2',
					refreshToken: 'r2',
					tokens: { access: 'a3' },
				},
			})
		);

		await backendFetch('https://api.test/api/auth/refresh', {
			method: 'POST',
			headers: { Authorization: 'Bearer a1' },
			body: JSON.stringify({ refreshToken: 'r1' }),
		});
		await flushLogs();

		expect(logged()).toContain('[redacted]');
		expect(logged()).not.toMatch(/a1|r1|a2|r2|a3/);
	});

	it('hides the sign-in code but keeps error codes', async () => {
		env.NODE_ENV = 'development';
		fetchMock.mockResolvedValue(json({ errorCode: 'OTP_INVALID' }, 400));

		await backendFetch('https://api.test/api/auth/verify-otp', {
			method: 'POST',
			body: JSON.stringify({ email: 'a@b.test', code: '123456' }),
		});
		await flushLogs();

		expect(logged()).not.toContain('123456');
		expect(logged()).toContain('OTP_INVALID');
	});

	it('leaves the response body readable for the caller', async () => {
		env.NODE_ENV = 'development';
		fetchMock.mockResolvedValue(json({ data: 1 }));

		const response = await backendFetch('https://api.test/api/x');

		await expect(response.json()).resolves.toEqual({ data: 1 });
	});

	it('logs and rethrows network errors', async () => {
		env.NODE_ENV = 'development';
		fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

		await expect(backendFetch('https://api.test/api/x')).rejects.toThrow(
			'ECONNREFUSED'
		);
		expect(logged()).toContain('GET https://api.test/api/x → failed');
		expect(logged()).toContain(': ECONNREFUSED');
	});
});
