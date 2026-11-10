import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { CommunityMembers } from '@/features/communities/CommunityMembers';
import type { CommunityMember, CommunityRole,MyCommunity } from '@/features/communities/schema';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
const mockRefresh = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh, replace: mockReplace }) }));
jest.mock('@/lib/api/services/users', () => ({ searchUsers: jest.fn() }));
jest.mock('@/features/communities/service', () => ({
	addMember: jest.fn(),
	changeRole: jest.fn(),
	removeMember: jest.fn(),
	transferOwner: jest.fn(),
}));

const member = (userId: string, role: CommunityRole): CommunityMember => ({
	userId,
	username: userId,
	displayName: null,
	avatarUrl: null,
	role,
	joinedAt: '2026-11-09T10:00:00+08:00',
});

const members = [member('olive', 'OWNER'), member('adam', 'ADMIN'), member('ed', 'EDITOR')];

function renderAs(viewerId: string) {
	const role = members.find((m) => m.userId === viewerId)!.role;
	const community: MyCommunity = { communityId: 'off1', username: 'sunrise', displayName: 'Sunrise', avatarUrl: null, role };
	render(<CommunityMembers community={community} viewerId={viewerId} members={members} />);
}

const moreButton = (name: string) => screen.queryByRole('button', { name: `More for @${name}` });

async function openMenu(name: string) {
	fireEvent.click(moreButton(name)!);
	return within(await screen.findByRole('menu'));
}

describe('CommunityMembers', () => {
	beforeEach(() => jest.clearAllMocks());

	it('lists every member with role and username', () => {
		renderAs('ed');
		const rows = screen.getAllByRole('listitem').slice(0, 3);
		expect(rows[0]).toHaveTextContent('@olive');
		expect(rows[0]).toHaveTextContent('Owner');
		expect(rows[2]).toHaveTextContent('Editor');
		// Every role is explained, Chief editor included
		expect(screen.getByText('Chief editor')).toBeInTheDocument();
	});

	it('gives an OWNER every action on others, including making them owner', async () => {
		renderAs('olive');
		expect(screen.getByRole('button', { name: 'Add member' })).toBeInTheDocument();
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

	it('lets an EDITOR only leave', async () => {
		renderAs('ed');
		expect(screen.queryByRole('button', { name: 'Add member' })).not.toBeInTheDocument();
		expect(moreButton('olive')).not.toBeInTheDocument();
		expect(moreButton('adam')).not.toBeInTheDocument();
		const menu = await openMenu('ed');
		expect(menu.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Leave']);
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

	it('refreshes the list when the member is already gone', async () => {
		const { removeMember } = jest.requireMock('@/features/communities/service');
		removeMember.mockResolvedValue({ ok: false, status: 404, errorCode: 'community.member.not_found', message: 'raw' });
		renderAs('olive');
		fireEvent.click((await openMenu('ed')).getByRole('menuitem', { name: 'Remove' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
		await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
	});

	it('shows community accounts in the search, badged, but not pickable', async () => {
		const { searchUsers } = jest.requireMock('@/lib/api/services/users');
		searchUsers.mockResolvedValue({
			items: [
				{ id: 'u9', username: 'cityhall', displayName: null, avatarUrl: null, community: true },
				{ id: 'u8', username: 'cindy', displayName: null, avatarUrl: null },
			],
			nextCursor: null,
		});
		renderAs('olive');
		fireEvent.click(screen.getByRole('button', { name: 'Add member' }));
		fireEvent.change(await screen.findByRole('textbox', { name: 'Search by username' }), { target: { value: 'ci' } });
		const community = await screen.findByRole('button', { name: /cityhall/ });
		expect(community).toBeDisabled();
		expect(within(community).getByRole('img', { name: 'Community account' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /cindy/ })).toBeEnabled();
	});
});
