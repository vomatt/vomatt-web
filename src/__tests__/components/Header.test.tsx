import { render, screen } from '@testing-library/react';

import { Header } from '@/components/layout/Header';

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

	it('links the logo home', () => {
		render(<Header {...guest} />);
		expect(screen.getByRole('link', { name: 'vomatt' })).toHaveAttribute('href', '/');
	});

	it('is left out on /login, which has its own logo', () => {
		mockPathname = '/login';
		render(<Header {...guest} />);
		expect(header()).toBeNull();
	});

	it('offers guests Log in and no More menu', () => {
		render(<Header {...guest} loginLink="/login?session_expired=1" />);
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login?session_expired=1');
		expect(screen.queryByRole('button', { name: /More/ })).not.toBeInTheDocument();
	});

	it('gives the signed-in person the More menu and leaves Notifications and the profile to the TabBar', () => {
		render(<Header {...mei} />);
		expect(screen.getByRole('button', { name: 'More (signed in)' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: /Notifications/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
	});
});
