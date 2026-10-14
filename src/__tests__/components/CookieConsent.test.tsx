import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
jest.mock('@/components/layout/HeadTrackingCode', () => ({
	HeadTrackingCode: () => <div data-testid="tracking" />,
}));

import { CookieConsent, CookieSettingsButton } from '@/components/layout/CookieConsent';

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

describe('CookieSettingsButton', () => {
	it('shows the banner again after a Decline', () => {
		document.cookie = 'cookie-consent=denied; path=/';
		render(
			<>
				<CookieConsent integrations={integrations} />
				<CookieSettingsButton />
			</>
		);
		expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /cookie settings/i }));
		expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
	});
});
