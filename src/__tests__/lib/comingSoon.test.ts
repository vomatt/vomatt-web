import { isComingSoon } from '@/lib/comingSoon';

describe('isComingSoon()', () => {
	it('shows the site once Sanity turns the page off', () => {
		expect(isComingSoon({ comingSoon: { enabled: false } }, 'production')).toBe(false);
	});

	it('keeps the page while it is on, or not set yet', () => {
		expect(isComingSoon({ comingSoon: { enabled: true } }, 'production')).toBe(true);
		expect(isComingSoon({}, 'production')).toBe(true);
	});

	it('keeps the page when Sanity cannot be reached', () => {
		expect(isComingSoon(null, 'production')).toBe(true);
	});

	it('never shows it in local development', () => {
		expect(isComingSoon({ comingSoon: { enabled: true } }, 'development')).toBe(false);
	});
});
