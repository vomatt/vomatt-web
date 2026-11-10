import { render, screen } from '@testing-library/react';

import { Layout } from '@/components/layout';
import { loadMyProfile } from '@/data/auth';

jest.mock('@/data/auth', () => ({
	getUserSession: async () => ({ sub: 'u1' }),
	getLoginHref: async () => '/login',
	loadMyProfile: jest.fn(),
	loadActingState: async () => ({ acting: null, me: null, communities: [], stale: false }),
}));
jest.mock('@/components/layout/AppSidebar', () => ({ AppSidebar: () => null }));
jest.mock('@/components/layout/TabBar', () => ({ TabBar: () => null }));
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	UnreadCountProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/SessionRetry', () => ({
	SessionRetry: () => <p>Signing you in</p>,
	ReloadWhenSessionUnconfirmed: () => null,
}));

it('waits on SessionRetry instead of crashing when the profile cannot load', async () => {
	jest.spyOn(console, 'error').mockImplementation(() => {});
	(loadMyProfile as jest.Mock).mockResolvedValue({ profile: null, error: new Error('fetch failed') });

	render(await Layout({ children: <p>Page</p> }));

	expect(screen.getByText('Signing you in')).toBeInTheDocument();
	expect(screen.queryByText('Page')).not.toBeInTheDocument();
});
