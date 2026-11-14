import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { actAsCommunity } from '@/features/communities/acting';
import { CommunityInvitationCard } from '@/features/communities/CommunityInvitationCard';
import type { CommunityInvitationDetail, MyCommunity } from '@/features/communities/schema';
import { acceptCommunityInvitation, declineCommunityInvitation } from '@/features/communities/service';
import { signout } from '@/lib/api/services/auth';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush, refresh: jest.fn() }) }));
jest.mock('@/features/communities/service', () => ({
	acceptCommunityInvitation: jest.fn(),
	declineCommunityInvitation: jest.fn(),
}));
jest.mock('@/lib/api/services/auth', () => ({ signout: jest.fn() }));
const mockRefreshUnread = jest.fn();
jest.mock('@/features/notifications/UnreadCountProvider', () => ({
	useUnreadCount: () => ({ count: 1, isLoaded: true, refresh: mockRefreshUnread }),
}));
const mockToastError = jest.fn();
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: jest.fn() } }));

const mockAccept = acceptCommunityInvitation as jest.Mock;
const mockDecline = declineCommunityInvitation as jest.Mock;

const invitation: CommunityInvitationDetail = {
	id: 'i1',
	role: 'EDITOR',
	expiresAt: '2026-11-21T10:00:00Z',
	community: { id: 'c1', username: 'robotics', displayName: 'Robotics Club', avatarUrl: null, community: true },
	inviter: { id: 'u1', username: 'ada', displayName: 'Ada', avatarUrl: null },
	locked: false,
	member: false,
};
const membership = (role: MyCommunity['role']): MyCommunity => ({
	communityId: 'c1',
	username: 'robotics',
	displayName: 'Robotics Club',
	avatarUrl: null,
	role,
});

const renderCard = (open: CommunityInvitationDetail | null = invitation) =>
	render(<CommunityInvitationCard invitationId="i1" invitation={open} signedInAs="mei@example.com" />);
const button = (name: string) => screen.getByRole('button', { name });

beforeEach(() => jest.clearAllMocks());

describe('CommunityInvitationCard', () => {
	it('shows the community, the role and what it can do, who invited them and when it expires', async () => {
		renderCard();
		expect(screen.getByRole('heading', { level: 1, name: 'You’re invited to join Robotics Club' })).toBeInTheDocument();
		expect(screen.getByText('@robotics')).toBeInTheDocument();
		expect(screen.getByText('You’d join as Editor')).toBeInTheDocument();
		expect(screen.getByText('Posts polls and comments, and edits their own.')).toBeInTheDocument();
		expect(await screen.findByText('Invited by @ada Expires Nov 21, 2026')).toBeInTheDocument();
		expect(button('Accept')).toBeEnabled();
		expect(button('Decline')).toBeEnabled();
	});

	it('leaves the inviter out when the API doesn’t name one', () => {
		renderCard({ ...invitation, inviter: null });
		expect(screen.queryByText(/Invited by/)).not.toBeInTheDocument();
	});

	it('says they joined once accepted, moves focus there, and offers to switch to the account', async () => {
		mockAccept.mockResolvedValue({ ok: true, data: membership('EDITOR') });
		renderCard();
		fireEvent.click(button('Accept'));

		const heading = await screen.findByRole('heading', { level: 1, name: 'You joined Robotics Club as Editor' });
		expect(heading.closest('[tabindex="-1"]')).toHaveFocus();
		expect(mockAccept).toHaveBeenCalledWith('i1');
		expect(mockRefreshUnread).toHaveBeenCalled();
		expect(screen.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', '/robotics');

		fireEvent.click(button('Switch to Robotics Club'));
		await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/robotics'));
		expect(actAsCommunity).toHaveBeenCalledWith('c1');
	});

	it('offers no switch for a role that can’t act as the account', async () => {
		mockAccept.mockResolvedValue({ ok: true, data: membership('ANALYST') });
		renderCard({ ...invitation, role: 'ANALYST' });
		fireEvent.click(button('Accept'));

		await screen.findByRole('heading', { level: 1, name: 'You joined Robotics Club as Analyst' });
		expect(screen.queryByRole('button', { name: /Switch to/ })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'View profile' })).toBeInTheDocument();
	});

	it('confirms a decline with a way home', async () => {
		mockDecline.mockResolvedValue({ ok: true, data: undefined });
		renderCard();
		fireEvent.click(button('Decline'));

		expect(await screen.findByRole('heading', { level: 1, name: 'Invitation declined' })).toBeInTheDocument();
		expect(screen.getByText('You won’t join Robotics Club.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
		expect(mockDecline).toHaveBeenCalledWith('i1');
		expect(mockRefreshUnread).toHaveBeenCalled();
	});

	it('turns into the unavailable view when the invitation is gone by the time they answer', async () => {
		mockAccept.mockResolvedValue({ ok: false, status: 404, errorCode: 'community.invitation.not_found', message: '' });
		renderCard();
		fireEvent.click(button('Accept'));

		expect(await screen.findByRole('heading', { level: 1, name: 'This invitation isn’t available' })).toBeInTheDocument();
		expect(screen.getByText('mei@example.com')).toBeInTheDocument();
		expect(mockRefreshUnread).toHaveBeenCalled();
	});

	it('stays open with the reason when the account is locked', async () => {
		mockAccept.mockResolvedValue({ ok: false, status: 403, errorCode: 'community.locked', message: '' });
		renderCard();
		fireEvent.click(button('Accept'));

		await waitFor(() =>
			expect(mockToastError).toHaveBeenCalledWith(
				'This community account is locked, so it can’t do that. Upgrade to Pro, or have an owner with room unlock it.'
			)
		);
		expect(screen.getByRole('heading', { level: 1, name: 'You’re invited to join Robotics Club' })).toBeInTheDocument();
		expect(button('Accept')).toBeEnabled();
	});

	it('lets them answer again when the request never reaches the server', async () => {
		mockAccept.mockRejectedValue(new TypeError('Failed to fetch'));
		renderCard();
		fireEvent.click(button('Accept'));

		await waitFor(() => expect(mockToastError).toHaveBeenCalled());
		expect(button('Accept')).toBeEnabled();
		expect(button('Decline')).toBeEnabled();
	});

	it('says up front that a locked account can’t take members, and only lets them decline', () => {
		renderCard({ ...invitation, locked: true });
		expect(
			screen.getByText('Robotics Club is locked for now, so it can’t take new members. You can accept once an owner unlocks it.')
		).toBeInTheDocument();
		expect(button('Accept')).toBeDisabled();
		expect(button('Decline')).toBeEnabled();
	});

	it('says they were already in it, not that they joined, when accepting kept a membership', async () => {
		mockAccept.mockResolvedValue({ ok: true, data: membership('CHIEF_EDITOR') });
		renderCard({ ...invitation, member: true });
		fireEvent.click(button('Accept'));

		expect(
			await screen.findByRole('heading', { level: 1, name: 'You’re already in Robotics Club as Chief editor' })
		).toBeInTheDocument();
	});

	it('disables both answers while one is on its way', async () => {
		mockAccept.mockReturnValue(new Promise(() => {}));
		renderCard();
		fireEvent.click(button('Accept'));

		await waitFor(() => expect(button('Decline')).toBeDisabled());
		expect(screen.getByText('Accept').closest('button')).toHaveAttribute('data-loading');
	});
});

describe('CommunityInvitationCard, unavailable', () => {
	it('explains why and shows which address they’re signed in with', () => {
		renderCard(null);
		expect(screen.getByRole('heading', { level: 1, name: 'This invitation isn’t available' })).toBeInTheDocument();
		expect(screen.getByText(/sent to a different email address/)).toHaveTextContent('You’re signed in as mei@example.com.');
		expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute('href', '/notifications');
	});

	it('signs out and comes back here through log in to use a different account', () => {
		renderCard(null);
		fireEvent.click(button('Use a different account'));
		expect(signout).toHaveBeenCalledWith('/login?redirect=%2Fnotifications%2Fcommunity-invitations%2Fi1');
	});
});
