import { render, screen } from '@testing-library/react';

import SettingsPage from '@/app/(frontend)/settings/page';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
jest.mock('@/data/auth', () => ({
	getMyProfile: jest.fn().mockResolvedValue({ username: 'mei' }),
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
});
