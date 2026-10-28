const sanityFetchMock = jest.fn();
jest.mock('@/sanity/lib/live', () => ({
	sanityFetch: (...args: unknown[]) => sanityFetchMock(...args),
}));
// groq is ESM only
jest.mock('@/sanity/lib/queries', () => ({ pageGeneralSlugsQuery: 'slugs' }));

import sitemap from '@/app/sitemap';

const originalSiteUrl = process.env.SITE_URL;
beforeEach(() => {
	process.env.SITE_URL = 'https://vomatt.com';
});
afterAll(() => {
	process.env.SITE_URL = originalSiteUrl;
});

describe('sitemap.xml', () => {
	it('lists home, Explore and every Sanity page', async () => {
		sanityFetchMock.mockResolvedValue({ data: [{ slug: 'about' }, { slug: 'privacy-policy' }] });

		expect((await sitemap()).map(({ url }) => url)).toEqual([
			'https://vomatt.com',
			'https://vomatt.com/explore',
			'https://vomatt.com/about',
			'https://vomatt.com/privacy-policy',
		]);
	});
});
