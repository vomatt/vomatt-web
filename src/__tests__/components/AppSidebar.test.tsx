import { render, screen } from '@testing-library/react';

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

function renderSidebar() {
	return render(
		<SidebarProvider>
			<AppSidebar userSession={{}} profile={null} />
		</SidebarProvider>
	);
}

describe('AppSidebar unread count', () => {
	it('shows the count as ink on the highlight accent', () => {
		mockUnreadCount = 3;
		renderSidebar();
		expect(screen.getByText('3')).toHaveClass('bg-highlight', 'text-highlight-foreground');
	});

	it('shows no count when nothing is unread', () => {
		mockUnreadCount = 0;
		renderSidebar();
		expect(screen.queryByText('0')).not.toBeInTheDocument();
	});
});
