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
jest.mock('@/components/layout/Header', () => ({ Header: () => null }));
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	UnreadCountProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }), usePathname: () => '/' }));
jest.mock('@/features/communities/KeepCommunitiesPrompt', () => ({ KeepCommunitiesPrompt: () => <p>Which to keep?</p> }));
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

it('asks which community accounts to keep once the user owns more than their plan allows', async () => {
	const communityQuota = { owned: 3, limit: 1, selectionRequired: true, selectionDeadline: '2026-11-18T10:00:00Z' };
	(loadMyProfile as jest.Mock).mockResolvedValue({ profile: { username: 'mei', avatarUrl: null, communityQuota } });
	window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });

	render(await Layout({ children: <p>Page</p> }));

	expect(screen.getByText('Which to keep?')).toBeInTheDocument();
});
