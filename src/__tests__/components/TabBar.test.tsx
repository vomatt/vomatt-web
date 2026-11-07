import { render, screen } from '@testing-library/react';

import { TabBar } from '@/components/layout/TabBar';

let mockPathname = '/';
let mockPending = false;
jest.mock('next/link', () => {
	const actual = jest.requireActual('next/link');
	return { __esModule: true, ...actual, useLinkStatus: () => ({ pending: mockPending }) };
});
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
}));

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	formatUnreadCount: (count: number) => String(count),
	useUnreadCount: () => ({ count: 0 }),
}));

jest.mock('@/features/polls/components/CreatePollTrigger', () => ({
	CreatePollTrigger: () => null,
}));

const profileTab = () => screen.getByRole('link', { name: 'Profile' });

beforeEach(() => {
	mockPathname = '/';
	mockPending = false;
});

describe('TabBar', () => {
	it("shows the signed-in person's avatar on the profile tab", () => {
		render(<TabBar userSession={{}} username="mei" avatarUrl="bot:boba" />);
		expect(profileTab()).toHaveAttribute('href', '/mei');
		expect(profileTab().querySelector('img')).toHaveAttribute('src', '/avatars/boba.svg');
	});

	it('shows the account icon to guests', () => {
		render(<TabBar />);
		expect(profileTab()).toHaveAttribute('href', '/account');
		expect(profileTab().querySelector('img')).toBeNull();
	});

	it('reaches Notifications where My polls used to be', () => {
		render(<TabBar userSession={{}} username="mei" />);
		expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute('href', '/notifications');
		expect(screen.queryByRole('link', { name: 'My Polls' })).not.toBeInTheDocument();
	});

	it.each(['/settings', '/settings/language'])('keeps the profile tab active on %s', (pathname) => {
		mockPathname = pathname;
		render(<TabBar userSession={{}} username="mei" />);
		expect(profileTab()).toHaveAttribute('aria-current', 'true');
		expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
	});

	it('marks the profile tab as the page on the profile itself', () => {
		mockPathname = '/mei';
		render(<TabBar userSession={{}} username="mei" />);
		expect(profileTab()).toHaveAttribute('aria-current', 'page');
	});

	it('marks a tapped tab while its page is still loading', () => {
		mockPending = true;
		render(<TabBar userSession={{}} username="mei" />);
		const icon = screen.getByRole('link', { name: 'Explore' }).querySelector('[data-pending]');
		expect(icon).toHaveClass('text-foreground');
	});

	it('leaves other tabs unmarked when no navigation is pending', () => {
		render(<TabBar userSession={{}} username="mei" />);
		const explore = screen.getByRole('link', { name: 'Explore' });
		expect(explore.querySelector('[data-pending]')).toBeNull();
		expect(explore.querySelector('.text-muted-foreground')).not.toBeNull();
	});
});
