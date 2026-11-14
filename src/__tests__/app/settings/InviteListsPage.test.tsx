import { render, screen } from '@testing-library/react';

import InviteListsPage from '@/app/(frontend)/settings/invite-lists/page';
import { ActingProvider } from '@/features/communities/ActingProvider';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
jest.mock('@/features/groups/GroupsPanel', () => ({ GroupsPanel: () => <p>Groups panel</p> }));
const mockLoadActingState = jest.fn();
jest.mock('@/data/auth', () => ({ loadActingState: () => mockLoadActingState() }));
beforeEach(() => mockLoadActingState.mockResolvedValue({ acting: null }));

describe('Invite lists page', () => {
	it('is titled Invite lists and leads back to Settings', async () => {
		render(await InviteListsPage());
		expect(screen.getByRole('heading', { level: 1, name: 'Invite lists' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to Settings' })).toHaveAttribute('href', '/settings');
		expect(screen.getByText('Groups panel')).toBeInTheDocument();
	});

	it('says the lists are the person’s own while acting as a community', async () => {
		const club = { communityId: 'c1', username: 'club', displayName: 'Robotics Club', avatarUrl: null, role: 'EDITOR' as const };
		mockLoadActingState.mockResolvedValue({ acting: club });
		render(
			<ActingProvider state={{ acting: club, me: null, communities: [club], stale: false }}>
				{await InviteListsPage()}
			</ActingProvider>
		);
		expect(screen.getByText('These settings are your own')).toBeInTheDocument();
		expect(screen.queryByText('Groups panel')).not.toBeInTheDocument();
	});
});
