import { render, screen } from '@testing-library/react';

import { LegalLinks } from '@/components/layout/LegalLinks';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

describe('LegalLinks', () => {
	it('links the three legal pages on the about site', () => {
		render(<LegalLinks />);

		const nav = screen.getByRole('navigation');
		const links = Array.from(nav.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')]);
		expect(links).toEqual([
			['Terms', 'https://about.vomatt.com/terms-of-service'],
			['Privacy', 'https://about.vomatt.com/privacy-policy'],
			['Cookies', 'https://about.vomatt.com/cookies-policy'],
		]);
	});
});
