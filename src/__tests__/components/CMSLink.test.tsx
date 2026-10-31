import { render, screen } from '@testing-library/react';

import CMSLink from '@/components/CMSLink';

function hrefOf(link: { linkType: string; href: string }) {
	render(<CMSLink link={{ _type: 'link', isNewTab: false, ...link }}>Go</CMSLink>);
	return screen.getByRole('link').getAttribute('href');
}

describe('CMSLink', () => {
	it('sends an internal link to the about site, where Pages and the Homepage live', () => {
		expect(hrefOf({ linkType: 'internal', href: '/privacy-policy' })).toBe(
			'https://about.vomatt.com/privacy-policy'
		);
	});

	it('keeps a relative external link in the app', () => {
		expect(hrefOf({ linkType: 'external', href: '/explore' })).toBe('/explore');
	});

	it('leaves an absolute external link as it is', () => {
		expect(hrefOf({ linkType: 'external', href: 'https://example.com' })).toBe('https://example.com');
	});
});
