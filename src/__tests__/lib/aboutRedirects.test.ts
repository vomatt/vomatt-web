import nextConfig from '../../../next.config';

describe('redirects to the about site', () => {
	it('send each old page to its page there, and the Cookies Policy straight to the Privacy Policy', async () => {
		const redirects = (await nextConfig.redirects?.()) ?? [];
		const destination = (source: string) => redirects.find((redirect) => redirect.source === source)?.destination;

		expect(destination('/privacy-policy')).toBe('https://about.vomatt.com/privacy-policy');
		expect(destination('/contact')).toBe('https://about.vomatt.com/contact');
		expect(destination('/cookies-policy')).toBe('https://about.vomatt.com/privacy-policy');
	});
});
