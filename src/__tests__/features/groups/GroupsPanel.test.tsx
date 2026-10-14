import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { toast } from 'sonner';

import { GroupsPanel } from '@/features/groups/GroupsPanel';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: Object.assign(jest.fn(), { error: jest.fn() }) }));
jest.mock('@/lib/api/services/users', () => ({ searchUsers: jest.fn() }));

const mockService = {
	getGroups: jest.fn(),
	createGroup: jest.fn(),
	renameGroup: jest.fn(),
	deleteGroup: jest.fn(),
	getGroupMembers: jest.fn(),
	addGroupMembers: jest.fn(),
	removeGroupMember: jest.fn(),
};
jest.mock('@/features/groups/service', () => ({
	getGroups: (...a: unknown[]) => mockService.getGroups(...a),
	createGroup: (...a: unknown[]) => mockService.createGroup(...a),
	renameGroup: (...a: unknown[]) => mockService.renameGroup(...a),
	deleteGroup: (...a: unknown[]) => mockService.deleteGroup(...a),
	getGroupMembers: (...a: unknown[]) => mockService.getGroupMembers(...a),
	addGroupMembers: (...a: unknown[]) => mockService.addGroupMembers(...a),
	removeGroupMember: (...a: unknown[]) => mockService.removeGroupMember(...a),
}));

const at = '2026-10-09T15:20:31+08:00';
const bookClub = { id: 'g1', name: 'Book club', memberCount: 1, createdAt: at };
const bob = { userId: 'u1', username: 'bob', email: null, addedAt: at };
const dave = { userId: null, username: null, email: 'dave@example.com', addedAt: at };

beforeEach(() => {
	jest.clearAllMocks();
	mockService.getGroups.mockResolvedValue({ ok: true, data: [bookClub] });
	mockService.getGroupMembers.mockResolvedValue({ ok: true, data: [bob] });
});

const openBookClub = async () => {
	fireEvent.click(await screen.findByRole('button', { name: /Book club/ }));
	return screen.findByRole('dialog');
};

describe('GroupsPanel', () => {
	it('lists the groups with their member counts', async () => {
		render(<GroupsPanel />);
		expect(await screen.findByText('Book club')).toBeInTheDocument();
		expect(screen.getByText('1 member')).toBeInTheDocument();
	});

	it('creates a group and opens it', async () => {
		mockService.getGroups.mockResolvedValue({ ok: true, data: [] });
		mockService.getGroupMembers.mockResolvedValue({ ok: true, data: [] });
		mockService.createGroup.mockResolvedValue({ ok: true, data: { ...bookClub, memberCount: 0 } });
		render(<GroupsPanel />);
		expect(await screen.findByText('No groups yet.')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Group name'), { target: { value: '  Book club ' } });
		fireEvent.click(screen.getByRole('button', { name: 'New group' }));

		await waitFor(() => expect(mockService.createGroup).toHaveBeenCalledWith('Book club'));
		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(screen.getByText('No members yet.')).toBeInTheDocument();
	});

	it('shows the API\'s reason when the group limit is reached', async () => {
		mockService.createGroup.mockResolvedValue({ ok: false, errorCode: 'group.max_reached', message: 'At most 50' });
		render(<GroupsPanel />);
		await screen.findByText('Book club');
		fireEvent.change(screen.getByLabelText('Group name'), { target: { value: 'One more' } });
		fireEvent.click(screen.getByRole('button', { name: 'New group' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('At most 50'));
	});

	it('adds a member by email and updates the count', async () => {
		mockService.addGroupMembers.mockResolvedValue({ ok: true, data: [bob, dave] });
		render(<GroupsPanel />);
		const dialog = await openBookClub();
		expect(await within(dialog).findByText('bob')).toBeInTheDocument();

		const field = within(dialog).getByLabelText('Add people');
		fireEvent.change(field, { target: { value: 'dave@example.com' } });
		fireEvent.keyDown(field, { key: 'Enter' });
		fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

		await waitFor(() =>
			expect(mockService.addGroupMembers).toHaveBeenCalledWith('g1', {
				userIds: [],
				emails: ['dave@example.com'],
			})
		);
		expect(await within(dialog).findByText('dave@example.com')).toBeInTheDocument();
		expect(screen.getByText('2 members')).toBeInTheDocument();
	});

	it('removes a member', async () => {
		mockService.removeGroupMember.mockResolvedValue({ ok: true, data: [] });
		render(<GroupsPanel />);
		const dialog = await openBookClub();
		fireEvent.click(await within(dialog).findByRole('button', { name: 'Remove bob' }));
		await waitFor(() => expect(mockService.removeGroupMember).toHaveBeenCalledWith('g1', bob));
		expect(await within(dialog).findByText('No members yet.')).toBeInTheDocument();
	});

	it('renames the group', async () => {
		mockService.renameGroup.mockResolvedValue({ ok: true, data: { ...bookClub, name: 'Readers' } });
		render(<GroupsPanel />);
		const dialog = await openBookClub();
		const rename = within(dialog).getByRole('button', { name: 'Rename' });
		expect(rename).toBeDisabled();
		fireEvent.change(within(dialog).getByLabelText('Group name'), { target: { value: 'Readers' } });
		fireEvent.click(rename);
		await waitFor(() => expect(mockService.renameGroup).toHaveBeenCalledWith('g1', 'Readers'));
		expect(await screen.findByText('Readers', { selector: 'span' })).toBeInTheDocument();
	});

	it('deletes the group after confirming', async () => {
		mockService.deleteGroup.mockResolvedValue({ ok: true, data: undefined });
		render(<GroupsPanel />);
		const dialog = await openBookClub();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Delete group' }));
		expect(within(dialog).getByText(/keep their invitees/)).toBeInTheDocument();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Delete group' }));
		await waitFor(() => expect(mockService.deleteGroup).toHaveBeenCalledWith('g1'));
		expect(await screen.findByText('No groups yet.')).toBeInTheDocument();
	});
});
