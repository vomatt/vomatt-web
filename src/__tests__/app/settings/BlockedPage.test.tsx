import { render, screen } from '@testing-library/react';

import BlockedPage from '@/app/(frontend)/settings/blocked/page';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
jest.mock('@/features/blocks/BlockedUsersPanel', () => ({ BlockedUsersPanel: () => <p>Blocked panel</p> }));
const mockLoadActingState = jest.fn();
jest.mock('@/data/auth', () => ({ loadActingState: () => mockLoadActingState() }));
beforeEach(() => mockLoadActingState.mockResolvedValue({ acting: null }));

describe('Blocked people page', () => {
	it('is titled Blocked people and leads back to Settings', async () => {
		render(await BlockedPage());
		expect(screen.getByRole('heading', { level: 1, name: 'Blocked people' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.getByText('Blocked panel')).toBeInTheDocument();
	});

	it('leads back to the community’s members page while acting as it', async () => {
		const club = { communityId: 'c1', username: 'club', displayName: 'Robotics Club', avatarUrl: null, role: 'OWNER' as const };
		mockLoadActingState.mockResolvedValue({ acting: club });
		render(await BlockedPage());
		expect(screen.getByRole('link', { name: 'Back to Robotics Club’s members' })).toHaveAttribute(
			'href',
			'/settings/communities/c1/members'
		);
	});
});
