import sitemap from '@/app/sitemap';

const originalSiteUrl = process.env.SITE_URL;
beforeEach(() => {
	process.env.SITE_URL = 'https://vomatt.com';
});
afterAll(() => {
	process.env.SITE_URL = originalSiteUrl;
});

describe('sitemap.xml', () => {
	it('lists home and Explore', () => {
		expect(sitemap().map(({ url }) => url)).toEqual(['https://vomatt.com', 'https://vomatt.com/explore']);
	});
});
