import nextConfig from '../../../next.config';

describe('next.config redirects', () => {
	it('sends the old sign-up page to the one login form', async () => {
		const redirects = await nextConfig.redirects!();
		expect(redirects).toContainEqual({ source: '/signup', destination: '/login', permanent: true });
	});
});
