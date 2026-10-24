import { render, screen } from '@testing-library/react';

import { TabBar } from '@/components/layout/TabBar';

jest.mock('next/navigation', () => ({
	usePathname: () => '/',
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
});
