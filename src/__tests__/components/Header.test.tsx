import { render, screen } from '@testing-library/react';

import { Header } from '@/components/layout/Header';
import { HeaderBack } from '@/components/layout/HeaderStart';

let mockPathname = '/';
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));
jest.mock('@/components/layout/MoreMenu', () => ({
	MoreMenu: ({ signedIn }: { signedIn: boolean }) => <button type="button">More{signedIn ? ' (signed in)' : ''}</button>,
}));

const guest = { signedIn: false, loginLink: '/login' };
const mei = { signedIn: true, loginLink: '/login' };

function header() {
	return document.querySelector('[data-mobile-header]');
}

describe('Header', () => {
	beforeEach(() => {
		mockPathname = '/';
	});

	it('keeps its text out of search snippets', () => {
		render(<Header {...guest} />);
		expect(screen.getByRole('link', { name: 'vomatt' }).closest('[data-nosnippet]')).not.toBeNull();
	});

	it('links the logo home', () => {
		render(<Header {...guest} />);
		expect(screen.getByRole('link', { name: 'vomatt' })).toHaveAttribute('href', '/');
	});

	it('is left out on /login, which has its own logo', () => {
		mockPathname = '/login';
		render(<Header {...guest} />);
		expect(header()).toBeNull();
	});

	it('offers guests Log in and the More menu, which holds the legal pages', () => {
		render(<Header {...guest} loginLink="/login?session_expired=1" />);
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login?session_expired=1');
		expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
	});

	it('gives the signed-in person the More menu and leaves Notifications and the profile to the TabBar', () => {
		render(<Header {...mei} />);
		expect(screen.getByRole('button', { name: 'More (signed in)' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Notifications/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
	});

	it('shows the page\'s way back while the page is shown, and none once it is gone', () => {
		const { rerender } = render(
			<>
				<Header {...guest} />
				<HeaderBack href="/me" label="Back" />
			</>
		);
		expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/me');

		rerender(<Header {...guest} />);
		expect(screen.queryByRole('link', { name: 'Back' })).not.toBeInTheDocument();
	});
});
