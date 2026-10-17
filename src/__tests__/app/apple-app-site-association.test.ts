/**
 * @jest-environment node
 */
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';

const sanityFetchMock = jest.fn();
jest.mock('@/sanity/lib/live', () => ({
	sanityFetch: (...args: unknown[]) => sanityFetchMock(...args),
}));
// next-sanity is ESM only
jest.mock('@/sanity/lib/queries', () => ({ pageGeneralSlugsQuery: 'slugs' }));

import { GET } from '@/app/.well-known/apple-app-site-association/route';
import { config } from '@/proxy';

type Component = { '/': string; exclude?: true };

/** The first component iOS would match, as Apple evaluates them (`*` spans `/`). */
function firstMatch(components: Component[], path: string) {
	const toRegex = (pattern: string) =>
		new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
	return components.find((c) => toRegex(c['/']).test(path));
}

async function components() {
	const res = await GET();
	const body = await res.json();
	return body.applinks.details[0].components as Component[];
}

const opensApp = async (path: string) => {
	const match = firstMatch(await components(), path);
	return !!match && !match.exclude;
};

const originalIds = process.env.IOS_APP_IDS;
beforeEach(() => {
	process.env.IOS_APP_IDS = 'TEAM1.com.vomatt.app';
	sanityFetchMock.mockReset();
	sanityFetchMock.mockResolvedValue({ data: [{ slug: 'about' }] });
});
afterAll(() => {
	process.env.IOS_APP_IDS = originalIds;
});

describe('apple-app-site-association', () => {
	it('is not served when IOS_APP_IDS is unset', async () => {
		delete process.env.IOS_APP_IDS;

		expect((await GET()).status).toBe(404);
	});

	it('serves JSON with every app ID from IOS_APP_IDS', async () => {
		process.env.IOS_APP_IDS = 'TEAM1.com.vomatt.app, TEAM2.com.vomatt.app';

		const res = await GET();

		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/json');
		expect((await res.json()).applinks.details[0].appIDs).toEqual([
			'TEAM1.com.vomatt.app',
			'TEAM2.com.vomatt.app',
		]);
	});

	it.each(['/poll/abc123', '/alice', '/bob_99'])('opens %s in the app', async (path) => {
		expect(await opensApp(path)).toBe(true);
	});

	it.each([
		'/',
		'/login',
		'/explore',
		'/my-polls',
		'/notifications',
		'/account',
		'/sanity',
		'/api',
		'/about',
		'/alice/followers',
		'/favicon.ico',
	])('keeps %s on the web', async (path) => {
		expect(await opensApp(path)).toBe(false);
	});

	it('still serves the static rules when Sanity is unreachable', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});
		sanityFetchMock.mockRejectedValue(new Error('network'));

		expect(await opensApp('/alice')).toBe(true);
		expect(await opensApp('/login')).toBe(false);
	});

	it('is not run through the proxy', () => {
		expect(
			unstable_doesMiddlewareMatch({ config, url: '/.well-known/apple-app-site-association' })
		).toBe(false);
		expect(unstable_doesMiddlewareMatch({ config, url: '/alice' })).toBe(true);
	});
});
