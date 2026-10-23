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
		expect(await screen.findByText('No invite lists yet.')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Invite list name'), { target: { value: '  Book club ' } });
		fireEvent.click(screen.getByRole('button', { name: 'New invite list' }));

		await waitFor(() => expect(mockService.createGroup).toHaveBeenCalledWith('Book club'));
		expect(await screen.findByRole('dialog')).toBeInTheDocument();
		expect(screen.getByText('No members yet.')).toBeInTheDocument();
	});

	it('shows the API\'s reason when the group limit is reached', async () => {
		mockService.createGroup.mockResolvedValue({ ok: false, errorCode: 'invite_list.max_reached', message: 'At most 50' });
		render(<GroupsPanel />);
		await screen.findByText('Book club');
		fireEvent.change(screen.getByLabelText('Invite list name'), { target: { value: 'One more' } });
		fireEvent.click(screen.getByRole('button', { name: 'New invite list' }));
		await waitFor(() => expect(toast.error).toHaveBeenCalledWith('At most 50', { duration: Infinity }));
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
		// Enabled, but an unchanged name sends nothing
		expect(rename).toBeEnabled();
		fireEvent.click(rename);
		expect(mockService.renameGroup).not.toHaveBeenCalled();
		fireEvent.change(within(dialog).getByLabelText('Invite list name'), { target: { value: 'Readers' } });
		fireEvent.click(rename);
		await waitFor(() => expect(mockService.renameGroup).toHaveBeenCalledWith('g1', 'Readers'));
		expect(await screen.findByText('Readers', { selector: 'span' })).toBeInTheDocument();
	});

	it('deletes the group after confirming', async () => {
		mockService.deleteGroup.mockResolvedValue({ ok: true, data: undefined });
		render(<GroupsPanel />);
		const dialog = await openBookClub();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Delete invite list' }));
		expect(within(dialog).getByText(/keep their invitees/)).toBeInTheDocument();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Delete invite list' }));
		await waitFor(() => expect(mockService.deleteGroup).toHaveBeenCalledWith('g1'));
		expect(await screen.findByText('No invite lists yet.')).toBeInTheDocument();
	});

	it('offers Try again when the groups fail to load', async () => {
		mockService.getGroups.mockResolvedValueOnce({ ok: false, message: '' });
		render(<GroupsPanel />);

		fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
		expect(await screen.findByText('Book club')).toBeInTheDocument();
		expect(mockService.getGroups).toHaveBeenCalledTimes(2);
	});

	it('offers Try again when the members fail to load', async () => {
		mockService.getGroupMembers.mockResolvedValueOnce({ ok: false, message: '' });
		render(<GroupsPanel />);
		await openBookClub();

		fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
		await waitFor(() => expect(mockService.getGroupMembers).toHaveBeenCalledTimes(2));
	});

	it('says to name the group instead of disabling Create', async () => {
		render(<GroupsPanel />);
		await screen.findByText('Book club');

		const input = screen.getByRole('textbox', { name: 'Invite list name' });
		fireEvent.click(screen.getByRole('button', { name: 'New invite list' }));
		expect(mockService.createGroup).not.toHaveBeenCalled();
		expect(input).toHaveAccessibleDescription('Name the invite list first.');
	});

	it('says an empty name is missing instead of disabling Rename', async () => {
		render(<GroupsPanel />);
		const dialog = await openBookClub();
		const input = within(dialog).getByLabelText('Invite list name');
		fireEvent.change(input, { target: { value: '  ' } });
		fireEvent.click(within(dialog).getByRole('button', { name: 'Rename' }));

		expect(mockService.renameGroup).not.toHaveBeenCalled();
		expect(input).toHaveAccessibleDescription('Name the invite list first.');
		await waitFor(() => expect(input).toHaveFocus());
	});

	it('shows "1 member" through the plural rules', async () => {
		render(<GroupsPanel />);
		expect(await screen.findByText('1 member')).toBeInTheDocument();
	});

	it('says to pick someone instead of disabling Add', async () => {
		render(<GroupsPanel />);
		const dialog = await openBookClub();
		fireEvent.click(within(dialog).getByRole('button', { name: 'Add' }));

		expect(mockService.addGroupMembers).not.toHaveBeenCalled();
		const input = within(dialog).getByLabelText('Add people');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription('Pick at least one person to add.');
		await waitFor(() => expect(input).toHaveFocus());
	});
});
