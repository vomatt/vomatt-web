import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/Sidebar';

let mockPathname = '/';
jest.mock('next/navigation', () => ({
	usePathname: () => mockPathname,
	useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock('@/hooks/use-mobile', () => ({
	useIsMobile: () => false,
}));

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key, currentLanguage: 'en', setLanguage: jest.fn() }),
}));

let mockUnreadCount = 0;
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	formatUnreadCount: (count: number) => String(count),
	useUnreadCount: () => ({ count: mockUnreadCount }),
}));

jest.mock('@/features/polls/components/CreatePollTrigger', () => ({
	CreatePollTrigger: () => null,
}));

jest.mock('@/lib/api/services/auth', () => ({
	signout: jest.fn(),
}));

jest.mock('@/features/feedback/service', () => ({
	reportProblem: jest.fn(),
}));

const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
	useTheme: () => ({ theme: 'light', setTheme: mockSetTheme }),
}));

function renderSidebar(userSession: object | null = {}) {
	return render(
		<SidebarProvider>
			<AppSidebar userSession={userSession} profile={null} />
		</SidebarProvider>
	);
}

describe('AppSidebar current page', () => {
	afterEach(() => {
		mockPathname = '/';
	});

	it('marks no row current on Settings, a page of its own', () => {
		mockPathname = '/settings';
		renderSidebar();
		expect(document.querySelector('[aria-current]')).toBeNull();
	});
});

describe('AppSidebar unread count', () => {
	it('shows the unread count', () => {
		mockUnreadCount = 3;
		renderSidebar();
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('shows no count when nothing is unread', () => {
		mockUnreadCount = 0;
		renderSidebar();
		expect(screen.queryByText('0')).not.toBeInTheDocument();
	});
});

describe('AppSidebar more menu', () => {
	it('switches the theme from Appearance', async () => {
		renderSidebar();
		await userEvent.click(
			screen.getByRole('button', { name: 'navigation.more' })
		);
		expect(
			await screen.findByRole('menuitemradio', {
				name: 'navigation.themeLight',
			})
		).toHaveAttribute('aria-checked', 'true');
		await userEvent.click(
			await screen.findByRole('menuitemradio', { name: 'navigation.themeDark' })
		);
		expect(mockSetTheme).toHaveBeenCalledWith('dark');
	});

	it('offers settings and log out when signed in', async () => {
		renderSidebar();
		await userEvent.click(
			screen.getByRole('button', { name: 'navigation.more' })
		);
		expect(
			await screen.findByRole('menuitem', { name: 'navigation.settings' })
		).toBeInTheDocument();
		expect(
			await screen.findByRole('menuitem', { name: 'account.signOut' })
		).toBeInTheDocument();
		expect(screen.getByRole('separator')).toBeInTheDocument();
	});

	it('offers guests only the theme choices', async () => {
		renderSidebar(null);
		await userEvent.click(
			screen.getByRole('button', { name: 'navigation.more' })
		);
		expect(await screen.findAllByRole('menuitemradio')).toHaveLength(3);
		expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
		// Nothing follows the theme choices, so no line closes them off
		expect(screen.queryByRole('separator')).not.toBeInTheDocument();
	});

	it('has no My polls row: it folded into Profile › Asked', () => {
		renderSidebar();
		expect(screen.queryByRole('link', { name: 'common.myPolls' })).not.toBeInTheDocument();
	});

	it('glides the hover mark to the row under the pointer, and steps aside for the keyboard', async () => {
		renderSidebar();
		await userEvent.click(
			screen.getByRole('button', { name: 'navigation.more' })
		);
		const settings = await screen.findByRole('menuitem', {
			name: 'navigation.settings',
		});
		settings.getBoundingClientRect = () => ({ top: 40, height: 40 }) as DOMRect;
		const mark = () =>
			document.querySelector<HTMLElement>('[data-slot=more-menu-hover-mark]');

		fireEvent.pointerOver(settings);
		expect(mark()!.style.height).toBe('40px');
		expect(mark()).not.toHaveClass('opacity-0');

		fireEvent.keyDown(settings, { key: 'ArrowDown' });
		expect(mark()).toHaveClass('opacity-0');
	});

	it('opens the report dialog from the menu', async () => {
		renderSidebar();
		await userEvent.click(
			screen.getByRole('button', { name: 'navigation.more' })
		);
		await userEvent.click(
			await screen.findByRole('menuitem', { name: 'navigation.reportProblem' })
		);
		expect(
			await screen.findByRole('dialog', { name: 'feedback.title' })
		).toBeInTheDocument();
	});
});

describe('AppSidebar nav', () => {
	it("marks only the current page's row", () => {
		renderSidebar();
		expect(screen.getByRole('link', { name: 'common.home' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('link', { name: 'common.explore' })).not.toHaveAttribute('aria-current');
		expect(screen.getByRole('link', { name: 'navigation.profile' })).not.toHaveAttribute('aria-current');
	});
});

describe('AppSidebar profile', () => {
	it('links to the profile from the nav when signed in', () => {
		renderSidebar();
		expect(
			screen.getByRole('link', { name: 'navigation.profile' })
		).toHaveAttribute('href', '/account');
	});
});
