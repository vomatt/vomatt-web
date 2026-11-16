import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
let mockPathname = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));
jest.mock('@/components/layout/HeadTrackingCode', () => ({
	HeadTrackingCode: () => <div data-testid="tracking" />,
}));

import { BottomPrompt } from '@/components/layout/BottomPrompt';
import { consentCookie, CookieChoiceRow, CookieConsent } from '@/components/layout/CookieConsent';

const integrations = { gaIDs: ['G-TEST'] };

function clearCookies() {
	document.cookie = 'cookie-consent=; path=/; max-age=0';
	document.cookie = 'terms-notice-dismissed=; path=/; max-age=0';
}

beforeEach(() => {
	clearCookies();
	mockPathname = '/';
});

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

describe('BottomPrompt terms notice', () => {
	const notice = () => screen.queryByRole('region', { name: 'Terms and cookies' });

	it('tells signed-out visitors which policies they agree to, linked on the about site', () => {
		render(<BottomPrompt signedIn={false} />);
		expect(notice()).toHaveTextContent('By continuing, you agree to vomatt’s Terms of Service and Privacy Policy');
		expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', expect.stringMatching(/\/terms-of-service$/));
		expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', expect.stringMatching(/\/privacy-policy$/));
	});

	it('stays away once dismissed', () => {
		const { unmount } = render(<BottomPrompt signedIn={false} />);
		fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(notice()).not.toBeInTheDocument();
		unmount();
		render(<BottomPrompt signedIn={false} />);
		expect(notice()).not.toBeInTheDocument();
	});

	it('is not shown to signed-in users', () => {
		render(<BottomPrompt signedIn />);
		expect(notice()).not.toBeInTheDocument();
	});

	it('is not shown on the login page, which has its own policy line', () => {
		mockPathname = '/login';
		render(<BottomPrompt signedIn={false} />);
		expect(notice()).not.toBeInTheDocument();
	});

	it('waits for the analytics question, so one prompt shows at a time', () => {
		render(<BottomPrompt integrations={integrations} signedIn={false} />);
		expect(notice()).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /decline/i }));
		expect(notice()).toBeInTheDocument();
	});
});

describe('consentCookie', () => {
	it('is shared across vomatt.com and its subdomains', () => {
		expect(consentCookie('granted', 'vomatt.com')).toContain('; domain=vomatt.com');
		expect(consentCookie('granted', 'about.vomatt.com')).toContain('; domain=vomatt.com');
	});

	it('clears the shared cookie when given no choice', () => {
		expect(consentCookie('', 'vomatt.com')).toBe('cookie-consent=; path=/; max-age=0; samesite=lax; domain=vomatt.com');
	});

	it('stays on the host elsewhere, where vomatt.com is not a valid cookie domain', () => {
		expect(consentCookie('granted', 'localhost')).not.toContain('domain=');
		expect(consentCookie('granted', 'vomatt-git-dev.vercel.app')).not.toContain('domain=');
	});
});

describe('CookieChoiceRow', () => {
	it('renders nothing when no analytics ID is set', () => {
		document.cookie = 'cookie-consent=denied; path=/';
		const { container } = render(<CookieChoiceRow integrations={{ gaIDs: [], gtmIDs: [] }} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('shows the choice and makes the banner ask again after a Decline', () => {
		render(
			<>
				<CookieConsent integrations={integrations} />
				<CookieChoiceRow integrations={integrations} />
			</>
		);
		fireEvent.click(screen.getByRole('button', { name: /decline/i }));
		expect(screen.getByText(/declined analytics cookies/i)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Change' }));
		expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
		expect(document.cookie).not.toContain('cookie-consent=');
		expect(screen.getByText('Choose in the cookie banner.')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument();
	});
});
