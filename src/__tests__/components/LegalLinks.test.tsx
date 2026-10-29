import { render, screen } from '@testing-library/react';

import { LegalLinks } from '@/components/layout/LegalLinks';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

describe('LegalLinks', () => {
	it('links the three legal pages', () => {
		render(<LegalLinks />);

		const nav = screen.getByRole('navigation');
		const links = Array.from(nav.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')]);
		expect(links).toEqual([
			['Terms', '/terms-of-service'],
			['Privacy', '/privacy-policy'],
			['Cookies', '/cookies-policy'],
		]);
	});
});
