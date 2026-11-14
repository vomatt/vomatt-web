import { act, render, screen } from '@testing-library/react';

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
