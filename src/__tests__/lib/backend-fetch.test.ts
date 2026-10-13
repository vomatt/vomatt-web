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
const logged = () => logSpy.mock.calls.map((args) => args.join(' ')).join('\n');

describe('backendFetch', () => {
	it('logs nothing outside development', async () => {
		env.NODE_ENV = 'production';
		fetchMock.mockResolvedValue(json({ data: { id: 'x' } }));

		await backendFetch('https://api.test/api/polls');
		await flushLogs();

		expect(logSpy).not.toHaveBeenCalled();
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
		expect(logged()).toContain('{"title":"Cats?"}');
		expect(logged()).toContain('{"data":{"id":"x"}}');
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
