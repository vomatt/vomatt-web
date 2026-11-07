import { render, screen } from '@testing-library/react';

import { LegalLinks } from '@/components/layout/LegalLinks';

let mockCurrentLanguage = 'en';
jest.mock('@/contexts/LanguageContext', () => {
	const { useLanguage } = jest.requireActual('../helpers/mockLanguage');
	return { useLanguage: () => ({ ...useLanguage(), currentLanguage: mockCurrentLanguage }) };
});

const hrefs = () =>
	Array.from(screen.getByRole('navigation').querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')]);

describe('LegalLinks', () => {
	afterEach(() => {
		mockCurrentLanguage = 'en';
	});

	it('links the legal pages on the about site', () => {
		render(<LegalLinks />);
		expect(hrefs()).toEqual([
			['Terms', 'https://about.vomatt.com/terms-of-service'],
			['Privacy', 'https://about.vomatt.com/privacy-policy'],
		]);
	});

	it('links the Chinese pages when the app is in Chinese', () => {
		mockCurrentLanguage = 'zh';
		render(<LegalLinks />);
		expect(hrefs().map(([, href]) => href)).toEqual([
			'https://about.vomatt.com/zh/terms-of-service',
			'https://about.vomatt.com/zh/privacy-policy',
		]);
	});
});
