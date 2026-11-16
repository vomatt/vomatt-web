import { act, fireEvent, render, screen } from '@testing-library/react';

import { TabBar } from '@/components/layout/TabBar';

let mockPathname = '/';
let mockPending = false;
jest.mock('next/link', () => {
	const actual = jest.requireActual('next/link');
	return { __esModule: true, ...actual, useLinkStatus: () => ({ pending: mockPending }) };
});
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
	useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/auth/AuthDialog', () => ({
	AuthDialog: ({ onAuthSuccess }: { onAuthSuccess: () => void }) => (
		<div data-testid="auth-dialog">
			<button type="button" onClick={onAuthSuccess}>
				Finish sign-in
			</button>
		</div>
	),
}));

jest.mock('@/contexts/LanguageContext', () => require('../helpers/mockLanguage'));

let mockUnreadCount = 0;
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	formatUnreadCount: (count: number) => String(count),
	useUnreadCount: () => ({ count: mockUnreadCount }),
}));

jest.mock('@/features/polls/components/PollCreator', () => ({
	PollCreator: ({ open }: { open: boolean }) => (open ? <div role="dialog">Creator</div> : null),
}));

const mei = { userSession: {}, username: 'mei', avatarUrl: 'bot:boba' };
const profileLink = () => screen.getByRole('link', { name: 'Profile' });

beforeEach(() => {
	mockPathname = '/';
	mockPending = false;
	mockUnreadCount = 0;
	mockPush.mockClear();
});

describe('TabBar', () => {
	it('centers Create between Home and Explore on one side, Notifications and the profile on the other', () => {
		render(<TabBar {...mei} />);
		const cells = Array.from(document.querySelector('[data-tabbar]')!.children);
		expect(cells).toEqual([
			screen.getByRole('link', { name: 'Home' }),
			screen.getByRole('link', { name: 'Explore' }),
			screen.getByRole('button', { name: 'Create a poll' }).parentElement,
			screen.getByRole('link', { name: 'Notifications' }),
			profileLink(),
		]);
	});

	it('gives guests the same five tabs', () => {
		render(<TabBar />);
		const cells = Array.from(document.querySelector('[data-tabbar]')!.children);
		expect(cells).toEqual([
			screen.getByRole('link', { name: 'Home' }),
			screen.getByRole('link', { name: 'Explore' }),
			screen.getByRole('button', { name: 'Create a poll' }).parentElement,
			screen.getByRole('button', { name: 'Notifications' }),
			screen.getByRole('button', { name: 'Profile' }),
		]);
	});

	it.each(['Create a poll', 'Notifications', 'Profile'])('asks a guest to sign in from %s instead of leaving the page', (name) => {
		render(<TabBar />);
		fireEvent.click(screen.getByRole('button', { name }));
		expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it.each([
		['Notifications', '/notifications'],
		['Profile', '/account'],
	])('takes a guest on to %s once they sign in', (name, href) => {
		render(<TabBar />);
		fireEvent.click(screen.getByRole('button', { name }));
		fireEvent.click(screen.getByRole('button', { name: 'Finish sign-in' }));
		expect(mockPush).toHaveBeenCalledWith(href);
	});

	it('opens the poll creator once a guest who pressed Create has signed in', async () => {
		const { rerender } = render(<TabBar />);
		fireEvent.click(screen.getByRole('button', { name: 'Create a poll' }));
		fireEvent.click(screen.getByRole('button', { name: 'Finish sign-in' }));
		rerender(<TabBar userSession={{}} />);
		expect(await screen.findByRole('dialog')).toHaveTextContent('Creator');
	});

	it('opens the poll creator when the session arrives before sign-in finishes (a new account names itself)', async () => {
		const { rerender } = render(<TabBar />);
		fireEvent.click(screen.getByRole('button', { name: 'Create a poll' }));
		rerender(<TabBar userSession={{}} />);
		fireEvent.click(screen.getByRole('button', { name: 'Finish sign-in' }));
		expect(await screen.findByRole('dialog')).toHaveTextContent('Creator');
	});

	it('asks a guest to sign in again after a sign-out, though they signed in from the tab bar before', () => {
		const { rerender } = render(<TabBar />);
		fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
		fireEvent.click(screen.getByRole('button', { name: 'Finish sign-in' }));
		rerender(<TabBar userSession={{}} />);
		rerender(<TabBar />);
		mockPush.mockClear();

		fireEvent.click(screen.getByRole('button', { name: 'Create a poll' }));
		expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
		expect(screen.queryByText('Creator')).not.toBeInTheDocument();
	});

	it('leaves the creator closed for a signed-in person until they press Create', () => {
		render(<TabBar userSession={{}} />);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('reads out the unread count on Notifications', () => {
		mockUnreadCount = 3;
		render(<TabBar {...mei} />);
		expect(screen.getByRole('link', { name: '3 Unread Notifications' })).toHaveAttribute('href', '/notifications');
	});

	it("shows the signed-in person's avatar, linking to their profile", () => {
		render(<TabBar {...mei} />);
		expect(profileLink()).toHaveAttribute('href', '/mei');
		expect(profileLink().querySelector('img')).toHaveAttribute('src', '/avatars/boba.svg');
	});

	it('shows the account icon, linking to /account, while the profile is not loaded', () => {
		render(<TabBar userSession={{}} />);
		expect(profileLink()).toHaveAttribute('href', '/account');
		expect(profileLink().querySelector('img')).toBeNull();
	});

	it.each(['/settings', '/settings/language'])('keeps the profile current on %s', (pathname) => {
		mockPathname = pathname;
		render(<TabBar {...mei} />);
		expect(profileLink()).toHaveAttribute('aria-current', 'true');
	});

	it('marks the profile as the page on the profile itself', () => {
		mockPathname = '/mei';
		render(<TabBar {...mei} />);
		expect(profileLink()).toHaveAttribute('aria-current', 'page');
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

	describe('with a text field focused and the visible viewport getting shorter', () => {
		const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
		const viewport = Object.assign(new EventTarget(), { width: 375, height: 0, offsetTop: 0, scale: 1 });
		let field: HTMLTextAreaElement;
		const resize = (height: number) =>
			act(() => {
				viewport.height = height;
				viewport.dispatchEvent(new Event('resize'));
			});
		const bar = () => document.querySelector('[data-tabbar]')!;

		beforeEach(() => {
			viewport.height = window.innerHeight;
			Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
			field = document.body.appendChild(document.createElement('textarea'));
		});
		afterEach(() => {
			field.remove();
			if (original) Object.defineProperty(window, 'visualViewport', original);
			else delete (window as { visualViewport?: unknown }).visualViewport;
			delete (window as { matchMedia?: unknown }).matchMedia;
		});

		it('stays behind an on-screen keyboard instead of riding up above it, and returns when it closes', () => {
			render(<TabBar userSession={{}} />);
			expect(bar()).toHaveClass('data-keyboard:invisible');
			expect(bar()).not.toHaveAttribute('data-keyboard');

			act(() => field.focus());
			resize(400);
			expect(bar()).toHaveAttribute('data-keyboard');

			resize(window.innerHeight);
			expect(bar()).not.toHaveAttribute('data-keyboard');
		});

		it('stays shown with a mouse, where a shorter window is not a keyboard (DevTools docked below)', () => {
			window.matchMedia = jest.fn((query: string) => ({ matches: query === '(pointer: fine)' }) as MediaQueryList);
			render(<TabBar userSession={{}} />);
			act(() => field.focus());
			resize(400);
			expect(bar()).not.toHaveAttribute('data-keyboard');
		});
	});
});
