import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
jest.mock('@/components/layout/HeadTrackingCode', () => ({
	HeadTrackingCode: () => <div data-testid="tracking" />,
}));

import { consentCookie, CookieConsent } from '@/components/layout/CookieConsent';

const integrations = { gaIDs: ['G-TEST'] };

function clearConsent() {
	document.cookie = 'cookie-consent=; path=/; max-age=0';
}

beforeEach(clearConsent);

describe('CookieConsent', () => {
	it('renders nothing when no analytics ID is set', () => {
		const { container } = render(<CookieConsent integrations={{ gaIDs: [] }} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('asks first and does not load analytics before a choice', () => {
		render(<CookieConsent integrations={integrations} />);
		expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
		expect(screen.queryByTestId('tracking')).not.toBeInTheDocument();
	});

	it('loads analytics and stores the choice after Accept', () => {
		render(<CookieConsent integrations={integrations} />);
		fireEvent.click(screen.getByRole('button', { name: /accept/i }));
		expect(screen.getByTestId('tracking')).toBeInTheDocument();
		expect(document.cookie).toContain('cookie-consent=granted');
	});

	it('hides the banner without loading analytics after Decline', () => {
		render(<CookieConsent integrations={integrations} />);
		fireEvent.click(screen.getByRole('button', { name: /decline/i }));
		expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
		expect(screen.queryByTestId('tracking')).not.toBeInTheDocument();
	});

	it('remembers an earlier Accept', () => {
		document.cookie = 'cookie-consent=granted; path=/';
		render(<CookieConsent integrations={integrations} />);
		expect(screen.getByTestId('tracking')).toBeInTheDocument();
	});
});

describe('consentCookie', () => {
	it('is shared across vomatt.com and its subdomains', () => {
		expect(consentCookie('granted', 'vomatt.com')).toContain('; domain=vomatt.com');
		expect(consentCookie('granted', 'about.vomatt.com')).toContain('; domain=vomatt.com');
	});

	it('stays on the host elsewhere, where vomatt.com is not a valid cookie domain', () => {
		expect(consentCookie('granted', 'localhost')).not.toContain('domain=');
		expect(consentCookie('granted', 'vomatt-git-dev.vercel.app')).not.toContain('domain=');
	});
});
