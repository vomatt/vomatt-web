import { render, screen } from '@testing-library/react';

import CommunityInvitationPage from '@/app/(frontend)/notifications/community-invitations/[invitationId]/page';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }) }));
jest.mock('@/lib/getServerLocale', () => ({ getServerMessages: jest.fn() }));
const mockProfile = jest.fn();
const mockRedirectToLogin = jest.fn();
jest.mock('@/data/auth', () => ({
	getMyProfile: () => mockProfile(),
	redirectToLogin: (path: string) => mockRedirectToLogin(path),
}));
const mockGetInvitation = jest.fn();
jest.mock('@/features/communities/service', () => ({
	getCommunityInvitation: (id: string) => mockGetInvitation(id),
	acceptCommunityInvitation: jest.fn(),
	declineCommunityInvitation: jest.fn(),
}));
const mockFetchPerson = jest.fn();
jest.mock('@/lib/api/services/users', () => ({ getMyProfile: (options: unknown) => mockFetchPerson(options) }));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
jest.mock('@/features/notifications/UnreadCountProvider', () => ({ useUnreadCount: () => ({ refresh: jest.fn() }) }));

const notFound = { ok: false, status: 404, errorCode: 'community.invitation.not_found', message: '' };

const renderPage = async () => {
	const page = await CommunityInvitationPage({ params: Promise.resolve({ invitationId: 'i1' }) });
	render(page);
};

beforeEach(() => jest.clearAllMocks());

describe('Community invitation page', () => {
	it('shows the open invitation', async () => {
		mockProfile.mockResolvedValue({ username: 'mei', email: 'mei@example.com' });
		mockGetInvitation.mockResolvedValue({
			ok: true,
			data: {
				id: 'i1',
				role: 'ADMIN',
				expiresAt: '2026-11-21T10:00:00Z',
				community: { id: 'c1', username: 'robotics', displayName: 'Robotics Club', avatarUrl: null },
				inviter: null,
			},
		});
		await renderPage();
		expect(mockGetInvitation).toHaveBeenCalledWith('i1');
		expect(screen.getByRole('heading', { level: 1, name: 'You’re invited to join Robotics Club' })).toBeInTheDocument();
	});

	it('names the address the person is signed in with when the invitation isn’t theirs to open', async () => {
		mockProfile.mockResolvedValue({ username: 'mei', email: 'mei@example.com' });
		mockGetInvitation.mockResolvedValue(notFound);
		await renderPage();
		expect(screen.getByRole('heading', { level: 1, name: 'This invitation isn’t available' })).toBeInTheDocument();
		expect(screen.getByText('mei@example.com')).toBeInTheDocument();
	});

	it('names the person’s address, not the community account’s, while acting as one', async () => {
		mockProfile.mockResolvedValue({ username: 'robotics', email: null, community: true });
		mockFetchPerson.mockResolvedValue({ username: 'mei', email: 'mei@example.com' });
		mockGetInvitation.mockResolvedValue(notFound);
		await renderPage();
		expect(mockFetchPerson).toHaveBeenCalledWith(true);
		expect(screen.getByText('mei@example.com')).toBeInTheDocument();
	});

	it('still explains the invitation, and logs why, when the person can’t be loaded while acting', async () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockProfile.mockResolvedValue({ username: 'robotics', email: null, community: true });
		mockFetchPerson.mockRejectedValue(new Error('Bad gateway'));
		mockGetInvitation.mockResolvedValue(notFound);
		await renderPage();
		expect(screen.getByRole('heading', { level: 1, name: 'This invitation isn’t available' })).toBeInTheDocument();
		expect(screen.queryByText(/signed in as/)).not.toBeInTheDocument();
		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});

	it('names the @handle of an account with no email', async () => {
		mockProfile.mockResolvedValue({ username: 'mei', email: null });
		mockGetInvitation.mockResolvedValue(notFound);
		await renderPage();
		expect(screen.getByText('@mei')).toBeInTheDocument();
	});

	it('says something went wrong, not that the invitation is gone, when the API fails otherwise', async () => {
		mockProfile.mockResolvedValue({ username: 'mei', email: 'mei@example.com' });
		mockGetInvitation.mockResolvedValue({ ok: false, status: 502, message: 'Bad gateway' });
		await renderPage();
		expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeInTheDocument();
		expect(screen.queryByText(/isn’t available/)).not.toBeInTheDocument();
	});

	it('sends a visitor with no profile to log in, back to this invitation', async () => {
		mockProfile.mockResolvedValue(null);
		mockGetInvitation.mockResolvedValue(notFound);
		await CommunityInvitationPage({ params: Promise.resolve({ invitationId: 'i1' }) });
		expect(mockRedirectToLogin).toHaveBeenCalledWith('/notifications/community-invitations/i1');
	});
});
