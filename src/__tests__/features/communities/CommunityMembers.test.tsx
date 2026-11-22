import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { ActingProvider, useActing } from '@/features/communities/ActingProvider';
import { CommunityMembers } from '@/features/communities/CommunityMembers';
import type { CommunityInvitation, CommunityMember, CommunityRole, MyCommunity } from '@/features/communities/schema';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
const mockRefresh = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh, replace: mockReplace }) }));
jest.mock('@/lib/api/services/users', () => ({ searchUsers: jest.fn() }));
jest.mock('@/features/communities/service', () => ({
	inviteMember: jest.fn(),
	resendInvitation: jest.fn(),
	revokeInvitation: jest.fn(),
	changeRole: jest.fn(),
	removeMember: jest.fn(),
	transferOwner: jest.fn(),
}));

const mockLoadCommunities = jest.fn();
jest.mock('@/features/communities/acting', () => ({
	actAsCommunity: jest.fn(),
	loadMyCommunities: (...a: unknown[]) => mockLoadCommunities(...a),
}));
const Accounts = () => <p>{`${useActing().communities?.length ?? 0} community accounts`}</p>;
const withAccounts = (ui: React.ReactNode) => (
	<ActingProvider state={{ acting: null, me: { username: 'me', displayName: 'Me', avatarUrl: null }, communities: null, stale: false }}>
		<Accounts />
		{ui}
	</ActingProvider>
);

const member = (userId: string, role: CommunityRole): CommunityMember => ({
	userId,
	username: userId,
	avatarUrl: null,
	role,
	joinedAt: '2026-11-09T10:00:00+08:00',
});

const members = [member('olive', 'OWNER'), member('adam', 'ADMIN'), member('ed', 'EDITOR')];

function renderAs(viewerId: string, invitations?: CommunityInvitation[]) {
	const role = members.find((m) => m.userId === viewerId)!.role;
	const community: MyCommunity = { communityId: 'off1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role };
	render(<CommunityMembers community={community} viewerId={viewerId} members={members} invitations={invitations} />);
}

const moreButton = (name: string) => screen.queryByRole('button', { name: `More for @${name}` });

async function openMenu(name: string) {
	fireEvent.click(moreButton(name)!);
	return within(await screen.findByRole('menu'));
}

describe('CommunityMembers', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists every member by username, linking to their profile, with their role', () => {
		renderAs('ed');
		const rows = screen.getAllByRole('listitem').slice(0, 3);
		expect(within(rows[0]).getByRole('link', { name: '@olive' })).toHaveAttribute('href', '/olive');
		expect(rows[0]).toHaveTextContent('Owner');
		expect(rows[2]).toHaveTextContent('Editor');
		// Every role is explained, Chief editor included
		expect(screen.getByText('Chief editor')).toBeInTheDocument();
	});

	it('gives an OWNER every action on others, including making them owner', async () => {
		renderAs('olive');
		expect(screen.getByRole('button', { name: 'Invite member' })).toBeInTheDocument();
		const menu = await openMenu('ed');
		expect(menu.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Change role', 'Make owner', 'Remove']);
	});

	it('gives an ADMIN no menu on the OWNER row and no Owner role to grant', async () => {
		renderAs('adam');
		expect(moreButton('olive')).not.toBeInTheDocument();
		const menu = await openMenu('ed');
		expect(menu.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Change role', 'Remove']);
		fireEvent.click(menu.getByRole('menuitem', { name: 'Change role' }));
		const dialog = await screen.findByRole('dialog');
		expect(within(dialog).queryByRole('button', { name: 'Owner' })).not.toBeInTheDocument();
		expect(within(dialog).getByRole('button', { name: 'Editor' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('keeps Analyst out of the role list until someone has it, and then keeps it as their choice', async () => {
		const withAnalyst = [...members, member('ana', 'ANALYST')];
		const community: MyCommunity = { communityId: 'off1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role: 'OWNER' };
		const { unmount } = render(<CommunityMembers community={community} viewerId="olive" members={members} />);
		expect(screen.queryByText('Sees result reports and voter lists; doesn’t post.')).not.toBeInTheDocument();
		unmount();

		render(<CommunityMembers community={community} viewerId="olive" members={withAnalyst} />);
		expect(screen.getByText('Sees result reports and voter lists; doesn’t post.')).toBeInTheDocument();
		const menu = await openMenu('ana');
		fireEvent.click(menu.getByRole('menuitem', { name: 'Change role' }));
		const dialog = await screen.findByRole('dialog');
		expect(within(dialog).getByRole('button', { name: 'Analyst' })).toHaveAttribute('aria-pressed', 'true');
	});

	it('lets an EDITOR only leave', async () => {
		renderAs('ed');
		expect(screen.queryByRole('button', { name: 'Invite member' })).not.toBeInTheDocument();
		expect(moreButton('olive')).not.toBeInTheDocument();
		expect(moreButton('adam')).not.toBeInTheDocument();
		const menu = await openMenu('ed');
		expect(menu.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Leave']);
	});

	it('drops the account from the user’s accounts once they leave', async () => {
		const { removeMember } = jest.requireMock('@/features/communities/service');
		removeMember.mockResolvedValue({ ok: true, data: undefined });
		mockLoadCommunities.mockResolvedValueOnce({ ok: true, data: [{ communityId: 'c1', username: 'c1', displayName: 'C1', avatarUrl: null, role: 'OWNER' as const }] }).mockResolvedValueOnce({ ok: true, data: [] });
		const community: MyCommunity = { communityId: 'off1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role: 'EDITOR' };
		render(withAccounts(<CommunityMembers community={community} viewerId="ed" members={members} />));
		expect(await screen.findByText('1 community accounts')).toBeInTheDocument();
		fireEvent.click((await openMenu('ed')).getByRole('menuitem', { name: 'Leave' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Leave' }));
		expect(await screen.findByText('0 community accounts')).toBeInTheDocument();
		expect(mockReplace).toHaveBeenCalledWith('/settings#communities');
	});

	it('says ownership must be handed over when the last owner leaves', async () => {
		const { removeMember } = jest.requireMock('@/features/communities/service');
		removeMember.mockResolvedValue({ ok: false, status: 409, errorCode: 'community.last_owner', message: 'raw' });
		renderAs('olive');
		fireEvent.click((await openMenu('olive')).getByRole('menuitem', { name: 'Leave' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Leave' }));
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				'A community account needs at least one owner. Transfer ownership first.',
				{ duration: Infinity }
			)
		);
		expect(removeMember).toHaveBeenCalledWith('off1', 'olive');
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('warns the owner they become an admin before handing ownership over', async () => {
		const { transferOwner } = jest.requireMock('@/features/communities/service');
		transferOwner.mockResolvedValue({ ok: true, data: undefined });
		renderAs('olive');
		fireEvent.click((await openMenu('adam')).getByRole('menuitem', { name: 'Make owner' }));
		const dialog = await screen.findByRole('alertdialog');
		expect(dialog).toHaveTextContent('you become an admin');
		fireEvent.click(within(dialog).getByRole('button', { name: 'Make owner' }));
		await waitFor(() => expect(transferOwner).toHaveBeenCalledWith('off1', 'adam'));
		expect(mockRefresh).toHaveBeenCalled();
	});

	const theirLimit = 'They already own as many community accounts as their plan allows, so they can’t become an owner.';
	const limitReached = { ok: false, status: 403, errorCode: 'community.limit_reached', message: 'raw' };

	it('says the member’s plan is full when they can’t be made owner', async () => {
		const { transferOwner } = jest.requireMock('@/features/communities/service');
		transferOwner.mockResolvedValue(limitReached);
		renderAs('olive');
		fireEvent.click((await openMenu('adam')).getByRole('menuitem', { name: 'Make owner' }));
		fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Make owner' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith(theirLimit, { duration: Infinity }));
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it('says the member’s plan is full when they can’t be granted the Owner role', async () => {
		const { changeRole } = jest.requireMock('@/features/communities/service');
		changeRole.mockResolvedValue(limitReached);
		renderAs('olive');
		fireEvent.click((await openMenu('ed')).getByRole('menuitem', { name: 'Change role' }));
		const dialog = await screen.findByRole('dialog');
		fireEvent.click(within(dialog).getByRole('button', { name: 'Owner' }));
		fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
		await waitFor(() => expect(changeRole).toHaveBeenCalledWith('off1', 'ed', 'OWNER'));
		expect(toast.error).toHaveBeenCalledWith(theirLimit, { duration: Infinity });
	});

	it('on a locked account, offers only handing ownership over and leaving, and says it is locked', async () => {
		const community: MyCommunity = { communityId: 'off1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role: 'OWNER', locked: true };
		render(<CommunityMembers community={community} viewerId="olive" members={members} />);
		expect(screen.getByText('Locked')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Invite member' })).not.toBeInTheDocument();
		expect((await openMenu('ed')).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Make owner']);
		fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
		expect((await openMenu('olive')).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Leave']);
	});

	it('refreshes the list when the member is already gone', async () => {
		const { removeMember } = jest.requireMock('@/features/communities/service');
		removeMember.mockResolvedValue({ ok: false, status: 404, errorCode: 'community.member.not_found', message: 'raw' });
		renderAs('olive');
		fireEvent.click((await openMenu('ed')).getByRole('menuitem', { name: 'Remove' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
	});

	it('invites an email address and lists it as pending, which can then be revoked', async () => {
		const { inviteMember, revokeInvitation } = jest.requireMock('@/features/communities/service');
		inviteMember.mockResolvedValue({
			ok: true,
			data: { id: 'i1', email: 'new@x.co', role: 'EDITOR', invitedAt: '2026-11-09T10:00:00Z', expiresAt: '2099-11-16T10:00:00Z' },
		});
		revokeInvitation.mockResolvedValue({ ok: true, data: undefined });
		renderAs('olive');
		fireEvent.click(screen.getByRole('button', { name: 'Invite member' }));
		fireEvent.change(await screen.findByRole('textbox', { name: 'Username or email' }), { target: { value: 'New@x.co' } });
		fireEvent.click(await screen.findByRole('button', { name: 'Invite new@x.co' }));
		fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Invite member' }));
		await waitFor(() => expect(inviteMember).toHaveBeenCalledWith('off1', { email: 'new@x.co' }, 'EDITOR'));
		expect(await screen.findByText('Pending invitations')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Revoke invitation: new@x.co' }));
		await waitFor(() => expect(revokeInvitation).toHaveBeenCalledWith('off1', 'i1'));
		await waitFor(() => expect(screen.queryByText('Pending invitations')).not.toBeInTheDocument());
	});

	it('resends an email invitation once its window has passed, and not before', async () => {
		const { resendInvitation } = jest.requireMock('@/features/communities/service');
		const base = { role: 'EDITOR' as const, invitedAt: '2026-11-09T10:00:00Z', expiresAt: '2099-11-16T10:00:00Z' };
		const next = { id: 'i1', email: 'a@x.co', ...base, resendAvailableAt: '2099-01-01T00:00:00Z' };
		resendInvitation.mockResolvedValue({ ok: true, data: next });
		renderAs('olive', [
			{ id: 'i1', email: 'a@x.co', ...base, resendAvailableAt: '2020-01-01T00:00:00Z' },
			{ id: 'i2', email: 'b@x.co', ...base, resendAvailableAt: '2099-01-01T00:00:00Z' },
			{ id: 'i3', username: 'cy', userId: 'u3', ...base, resendAvailableAt: null },
		]);
		expect(screen.getByRole('button', { name: 'Resend invitation: b@x.co' })).toBeDisabled();
		expect(screen.queryByRole('button', { name: /Resend invitation: @cy/ })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Resend invitation: a@x.co' }));
		await waitFor(() => expect(resendInvitation).toHaveBeenCalledWith('off1', 'i1'));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Resend invitation: a@x.co' })).toBeDisabled());
	});

	it('leaves inviting to the server, whose limit depends on the owner’s plan', () => {
		const base = { role: 'EDITOR' as const, invitedAt: '2026-11-09T10:00:00Z', resendAvailableAt: null };
		renderAs('olive', [
			{ id: 'i1', email: 'a@x.co', ...base, expiresAt: '2099-11-16T10:00:00Z' },
			{ id: 'i2', email: 'b@x.co', ...base, expiresAt: '2099-11-16T10:00:00Z' },
		]);
		expect(screen.getByRole('button', { name: 'Invite member' })).toBeEnabled();
	});

	it('closes the dialog, says the account is full and refreshes the list when another manager took the last seat', async () => {
		const { inviteMember } = jest.requireMock('@/features/communities/service');
		inviteMember.mockResolvedValue({ ok: false, status: 403, errorCode: 'community.member_limit_reached', message: 'raw' });
		renderAs('olive');
		fireEvent.click(screen.getByRole('button', { name: 'Invite member' }));
		fireEvent.change(await screen.findByRole('textbox', { name: 'Username or email' }), { target: { value: 'new@x.co' } });
		fireEvent.click(await screen.findByRole('button', { name: 'Invite new@x.co' }));
		const dialog = await screen.findByRole('dialog');
		fireEvent.click(within(dialog).getByRole('button', { name: 'Invite member' }));
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith('This community account has as many members and pending invitations as its plan allows. Revoke an invitation or remove a member to invite someone new.', {
				duration: Infinity,
			})
		);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(mockRefresh).toHaveBeenCalled();
	});

	it('shows a failed invitation in the dialog, under the invitee, until another is picked', async () => {
		const { inviteMember } = jest.requireMock('@/features/communities/service');
		inviteMember.mockResolvedValue({ ok: false, status: 409, errorCode: 'community.invitation.exists', message: 'raw' });
		renderAs('olive');
		fireEvent.click(screen.getByRole('button', { name: 'Invite member' }));
		fireEvent.change(await screen.findByRole('textbox', { name: 'Username or email' }), { target: { value: 'new@x.co' } });
		fireEvent.click(await screen.findByRole('button', { name: 'Invite new@x.co' }));
		const dialog = await screen.findByRole('dialog');
		const send = within(dialog).getByRole('button', { name: 'Invite member' });
		fireEvent.click(send);
		const error = 'They’re already invited. Revoke the pending invitation to send a new one.';
		await waitFor(() => expect(send).toHaveAccessibleDescription(error));
		expect(within(dialog).getByText(error)).toBeInTheDocument();
		expect(toast.error).not.toHaveBeenCalled();
		expect(mockRefresh).toHaveBeenCalled();
		// Sending again, with any role, would get the same answer
		fireEvent.click(within(dialog).getByRole('button', { name: 'Admin' }));
		expect(within(dialog).getByText(error)).toBeInTheDocument();
		expect(send).toBeDisabled();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Remove new@x.co' }));
		expect(within(dialog).queryByText(error)).not.toBeInTheDocument();
	});

	it('keeps a failure that isn’t about the invitee retryable, and clears it when the role changes', async () => {
		const { inviteMember, searchUsers } = {
			...jest.requireMock('@/features/communities/service'),
			...jest.requireMock('@/lib/api/services/users'),
		};
		searchUsers.mockResolvedValue({ items: [{ id: 'u8', username: 'cindy', displayName: null, avatarUrl: null }], nextCursor: null });
		inviteMember.mockResolvedValue({ ok: false, status: 500, message: 'raw' });
		renderAs('olive');
		fireEvent.click(screen.getByRole('button', { name: 'Invite member' }));
		fireEvent.change(await screen.findByRole('textbox', { name: 'Username or email' }), { target: { value: 'ci' } });
		fireEvent.click(await screen.findByRole('button', { name: /cindy/ }));
		const dialog = await screen.findByRole('dialog');
		expect(within(dialog).getByText('They get a notification to accept or decline.')).toBeInTheDocument();
		const send = within(dialog).getByRole('button', { name: 'Invite member' });
		fireEvent.click(send);
		await waitFor(() => expect(send).toHaveAccessibleDescription(/.+/));
		expect(send).toBeEnabled();
		expect(toast.error).not.toHaveBeenCalled();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Admin' }));
		expect(send).not.toHaveAccessibleDescription(/.+/);
	});

	it('shows community accounts in the search, unbadged and not pickable, saying why', async () => {
		const { searchUsers } = jest.requireMock('@/lib/api/services/users');
		searchUsers.mockResolvedValue({
			items: [
				{ id: 'u9', username: 'cityhall', displayName: null, avatarUrl: null, community: true },
				{ id: 'u8', username: 'cindy', displayName: null, avatarUrl: null },
			],
			nextCursor: null,
		});
		renderAs('olive');
		fireEvent.click(screen.getByRole('button', { name: 'Invite member' }));
		fireEvent.change(await screen.findByRole('textbox', { name: 'Username or email' }), { target: { value: 'ci' } });
		const community = await screen.findByRole('button', { name: /cityhall/ });
		expect(community).toBeDisabled();
		expect(community).toHaveAccessibleDescription('Community accounts can’t be members of another account.');
		expect(within(community).queryByRole('img', { name: 'Community account' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /cindy/ })).toBeEnabled();
	});
});
