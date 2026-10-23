import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppSidebar } from '@/components/layout/AppSidebar';
import { SidebarProvider } from '@/components/ui/Sidebar';

jest.mock('next/navigation', () => ({
	usePathname: () => '/',
}));

jest.mock('@/hooks/use-mobile', () => ({
	useIsMobile: () => false,
}));

jest.mock('@/contexts/LanguageContext', () => ({
	useLanguage: () => ({ t: (key: string) => key }),
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
	});

	it('offers only appearance to guests', async () => {
		renderSidebar(null);
		await userEvent.click(
			screen.getByRole('button', { name: 'navigation.more' })
		);
		expect(await screen.findAllByRole('menuitemradio')).toHaveLength(3);
		expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
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
