import { render, screen } from '@testing-library/react';

import SettingsPage from '@/app/(frontend)/settings/page';
import { loadActingState } from '@/data/auth';
import { ActingProvider } from '@/features/communities/ActingProvider';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ back: jest.fn(), refresh: jest.fn() }) }));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
jest.mock('@/data/auth', () => ({
	getMyProfile: jest.fn().mockResolvedValue({ username: 'mei' }),
	loadActingState: jest.fn().mockResolvedValue({ acting: null, me: null, communities: null, stale: false }),
	getMyCommunities: jest.fn().mockResolvedValue({ ok: true, data: [] }),
	redirectToLogin: jest.fn(),
}));
jest.mock('@/features/groups/service', () => ({ getGroups: jest.fn().mockResolvedValue({ ok: true, data: [] }) }));
jest.mock('@/features/notifications/service', () => ({ getNotificationPreferences: jest.fn().mockResolvedValue(null) }));
jest.mock('@/app/(frontend)/settings/_components/AccountSettings', () => ({
	__esModule: true,
	default: () => <p>Account settings</p>,
	SettingsNav: () => null,
}));

describe('Settings page', () => {
	it('leads back to the profile it is reached from', async () => {
		render(await SettingsPage());
		expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/mei');
	});

	it('points back to the person while acting as a community account', async () => {
		const acting = { communityId: 'c1', username: 'tower', displayName: 'Riverside Tower', avatarUrl: null, role: 'OWNER' as const };
		const state = { acting, me: null, communities: [acting], stale: false };
		(loadActingState as jest.Mock).mockResolvedValueOnce(state);
		render(<ActingProvider state={state}>{await SettingsPage()}</ActingProvider>);

		expect(screen.queryByText('Account settings')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Switch back to you' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Manage members' })).toHaveAttribute('href', '/settings/communities/c1/members');
	});
});
