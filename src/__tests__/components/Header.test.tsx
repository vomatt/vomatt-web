import { act, render, screen } from '@testing-library/react';

import { Header } from '@/components/layout/Header';

let mockPathname = '/';
let mockPending = false;
jest.mock('next/link', () => {
	const actual = jest.requireActual('next/link');
	return { __esModule: true, ...actual, useLinkStatus: () => ({ pending: mockPending }) };
});
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

function scrollTo(y: number) {
	act(() => {
		window.scrollY = y;
		window.dispatchEvent(new Event('scroll'));
	});
}

let mockIsMobile = true;
jest.mock('@/hooks/use-mobile', () => ({
	useIsMobile: () => mockIsMobile,
}));

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

let mockUnreadCount = 0;
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	formatUnreadCount: (count: number) => String(count),
	useUnreadCount: () => ({ count: mockUnreadCount }),
}));

const guest = { signedIn: false, loginLink: '/login' };
const mei = { signedIn: true, loginLink: '/login', username: 'mei', avatarUrl: 'bot:boba' };
const profileLink = () => screen.getByRole('link', { name: 'Profile' });

function header() {
	return document.querySelector('[data-mobile-header]');
}

describe('Header', () => {
	beforeEach(() => {
		mockPathname = '/';
		mockIsMobile = true;
		mockUnreadCount = 0;
		mockPending = false;
		window.scrollY = 0;
		Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true });
	});

	it('links the logo home', () => {
		render(<Header {...guest} />);
		expect(screen.getByRole('link', { name: 'vomatt' })).toHaveAttribute('href', '/');
	});

	it('hides when scrolling down past the header', () => {
		render(<Header {...guest} />);
		scrollTo(200);
		expect(header()).toHaveAttribute('data-hidden');
	});

	it('shows again when scrolling up', () => {
		render(<Header {...guest} />);
		scrollTo(400);
		scrollTo(300);
		expect(header()).not.toHaveAttribute('data-hidden');
	});

	it('ignores small upward jitter', () => {
		render(<Header {...guest} />);
		scrollTo(400);
		scrollTo(395);
		expect(header()).toHaveAttribute('data-hidden');
	});

	it('stays hidden through the bounce at the bottom of the page', () => {
		const bottom = 5000 - window.innerHeight;
		render(<Header {...guest} />);
		scrollTo(bottom - 100);
		scrollTo(bottom + 30);
		scrollTo(bottom);
		expect(header()).toHaveAttribute('data-hidden');
	});

	it('shows on a next page that fits the screen, scrolled back to the top', () => {
		const { rerender } = render(<Header {...guest} />);
		scrollTo(400);
		mockPathname = '/explore';
		Object.defineProperty(document.documentElement, 'scrollHeight', { value: window.innerHeight, configurable: true });
		rerender(<Header {...guest} />);
		scrollTo(0);
		expect(header()).not.toHaveAttribute('data-hidden');
	});

	it('stays hidden on a navigation that keeps the scroll position', () => {
		const { rerender } = render(<Header {...guest} />);
		scrollTo(400);
		mockPathname = '/topic/food';
		rerender(<Header {...guest} />);
		expect(header()).toHaveAttribute('data-hidden');
	});

	it('never hides on desktop, where the sidebar replaces it', () => {
		mockIsMobile = false;
		render(<Header {...guest} />);
		scrollTo(200);
		expect(header()).not.toHaveAttribute('data-hidden');
	});

	it('stays shown near the top of the page', () => {
		render(<Header {...guest} />);
		scrollTo(20);
		expect(header()).not.toHaveAttribute('data-hidden');
	});

	it('is left out on /login, which has its own logo', () => {
		mockPathname = '/login';
		render(<Header {...guest} />);
		expect(header()).toBeNull();
	});

	it('offers guests Log in instead of Notifications and the profile', () => {
		render(<Header {...guest} loginLink="/login?session_expired=1" />);
		expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login?session_expired=1');
		expect(screen.queryByRole('link', { name: /Notifications/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
	});

	it("shows the signed-in person's avatar, linking to their profile", () => {
		render(<Header {...mei} />);
		expect(profileLink()).toHaveAttribute('href', '/mei');
		expect(profileLink().querySelector('img')).toHaveAttribute('src', '/avatars/boba.svg');
	});

	it('shows the account icon, linking to /account, while the profile is not loaded', () => {
		render(<Header signedIn loginLink="/login" />);
		expect(profileLink()).toHaveAttribute('href', '/account');
		expect(profileLink().querySelector('img')).toBeNull();
	});

	it('reads out the unread count on Notifications', () => {
		mockUnreadCount = 3;
		render(<Header {...mei} />);
		expect(screen.getByRole('link', { name: '3 Unread Notifications' })).toHaveAttribute('href', '/notifications');
	});

	it('shows no unread dot when everything is read', () => {
		render(<Header {...mei} />);
		expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute('href', '/notifications');
	});

	it.each(['/settings', '/settings/language'])('keeps the profile current on %s', (pathname) => {
		mockPathname = pathname;
		render(<Header {...mei} />);
		expect(profileLink()).toHaveAttribute('aria-current', 'true');
	});

	it('marks the profile as the page on the profile itself', () => {
		mockPathname = '/mei';
		render(<Header {...mei} />);
		expect(profileLink()).toHaveAttribute('aria-current', 'page');
	});

	it('marks a tapped profile link while its page is still loading', () => {
		mockPending = true;
		render(<Header signedIn loginLink="/login" username="mei" />);
		expect(screen.getByRole('link', { name: 'Profile' }).querySelector('[data-pending]')).not.toBeNull();
	});
});
