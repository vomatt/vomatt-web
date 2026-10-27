import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { BlockedUsersPanel } from '@/features/blocks/BlockedUsersPanel';
import { getBlockedUsers, unblockUser } from '@/features/blocks/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/blocks/service', () => ({ getBlockedUsers: jest.fn(), unblockUser: jest.fn() }));

const mockGet = getBlockedUsers as jest.Mock;
const mockUnblock = unblockUser as jest.Mock;
const bob = { id: 'u1', username: 'bob', displayName: 'Bob', avatarUrl: 'bot:boba' };
const cy = { id: 'u2', username: 'cy', displayName: null, avatarUrl: null };

beforeEach(() => jest.resetAllMocks());

it('shows the empty state', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
	render(<BlockedUsersPanel />);
	expect(await screen.findByText('You haven’t blocked anyone.')).toBeInTheDocument();
});

it('offers Try again when loading fails', async () => {
	mockGet.mockResolvedValueOnce({ ok: false, message: 'x' });
	render(<BlockedUsersPanel />);
	expect(await screen.findByText('Couldn’t load blocked people.')).toBeInTheDocument();

	mockGet.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: null } });
	fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
	expect(await screen.findByText('@bob')).toBeInTheDocument();
});

it('unblocks a user and drops them from the list', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
	mockUnblock.mockResolvedValue({ ok: true, data: undefined });
	render(<BlockedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getAllByRole('button', { name: 'Unblock' })[0]);
	await waitFor(() => expect(screen.queryByText('@bob')).not.toBeInTheDocument());
	expect(mockUnblock).toHaveBeenCalledWith('u1');
	expect(screen.getByText('@cy')).toBeInTheDocument();
});

it('keeps the user and says so when unblocking fails', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob], nextCursor: null } });
	mockUnblock.mockResolvedValue({ ok: false, message: 'x' });
	render(<BlockedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t unblock. Try again.', { duration: Infinity }));
	expect(screen.getByText('@bob')).toBeInTheDocument();
});

it('loads more with the cursor', async () => {
	mockGet
		.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: 'c2' } })
		.mockResolvedValueOnce({ ok: true, data: { items: [cy], nextCursor: null } });
	render(<BlockedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
	expect(await screen.findByText('@cy')).toBeInTheDocument();
	expect(mockGet).toHaveBeenLastCalledWith('c2');
	expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
});
