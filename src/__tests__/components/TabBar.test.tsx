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

jest.mock('@/features/polls/components/CreatePollTrigger', () => ({
	CreatePollTrigger: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
	mockPathname = '/';
	mockPending = false;
});

describe('TabBar', () => {
	it('centers Create between Home and Explore', () => {
		render(<TabBar userSession={{}} />);
		const cells = Array.from(document.querySelector('[data-tabbar]')!.children);
		expect(cells).toEqual([
			screen.getByRole('link', { name: 'Home' }),
			screen.getByRole('button', { name: 'Create a poll' }).parentElement,
			screen.getByRole('link', { name: 'Explore' }),
		]);
	});

	it('leaves Notifications and the profile to the Header', () => {
		render(<TabBar userSession={{}} />);
		expect(screen.queryByRole('link', { name: /Notifications/ })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
	});

	it('sends guests to log in from Create', () => {
		render(<TabBar loginLink="/login?session_expired=1" />);
		expect(screen.getByRole('link', { name: 'Create a poll' })).toHaveAttribute('href', '/login?session_expired=1');
	});

	it('marks Explore as the page on /explore', () => {
		mockPathname = '/explore';
		render(<TabBar userSession={{}} />);
		expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
	});

	it('marks a tapped tab while its page is still loading', () => {
		mockPending = true;
		render(<TabBar userSession={{}} />);
		const icon = screen.getByRole('link', { name: 'Explore' }).querySelector('[data-pending]');
		expect(icon).toHaveClass('text-foreground');
	});

	it('leaves other tabs unmarked when no navigation is pending', () => {
		render(<TabBar userSession={{}} />);
		const explore = screen.getByRole('link', { name: 'Explore' });
		expect(explore.querySelector('[data-pending]')).toBeNull();
		expect(explore.querySelector('.text-muted-foreground')).not.toBeNull();
	});
});
