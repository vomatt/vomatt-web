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

it('lists each person by their @handle alone, leaving the title to the page', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
	render(<BlockedUsersPanel />);

	const items = await screen.findAllByRole('listitem');
	expect(items.map((item) => item.textContent)).toEqual(['@bobUnblock', '@cyUnblock']);
	expect(screen.queryByRole('heading')).not.toBeInTheDocument();
});

it('shows the empty state', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
	render(<BlockedUsersPanel />);
	expect(await screen.findByText('You haven’t blocked anyone.')).toHaveClass('empty-state');
	expect(screen.queryByRole('list')).not.toBeInTheDocument();
});

it('keeps Load more instead of the empty state when the people unblocked were only the first page', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob], nextCursor: 'c2' } });
	mockUnblock.mockResolvedValue({ ok: true, data: undefined });
	render(<BlockedUsersPanel />);

	fireEvent.click(await screen.findByRole('button', { name: 'Unblock @bob' }));
	await waitFor(() => expect(screen.queryByText('@bob')).not.toBeInTheDocument());
	expect(screen.queryByText('You haven’t blocked anyone.')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
});

it('offers Try again when loading fails', async () => {
	mockGet.mockResolvedValueOnce({ ok: false, message: 'x' });
	render(<BlockedUsersPanel />);
	expect(await screen.findByText('Couldn’t load blocked people.')).toBeInTheDocument();

	mockGet.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: null } });
	fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
	expect(await screen.findByText('@bob')).toBeInTheDocument();
	expect(screen.queryByText('Couldn’t load blocked people.')).not.toBeInTheDocument();
});

it('unblocks a user and drops them from the list', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
	mockUnblock.mockResolvedValue({ ok: true, data: undefined });
	render(<BlockedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getByRole('button', { name: 'Unblock @bob' }));
	await waitFor(() => expect(screen.queryByText('@bob')).not.toBeInTheDocument());
	expect(mockUnblock).toHaveBeenCalledWith('u1');
	expect(toast.success).toHaveBeenCalledWith('Unblocked @bob');
	expect(screen.getByText('@cy')).toBeInTheDocument();
});

it('keeps the user and says so when unblocking fails', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob], nextCursor: null } });
	mockUnblock.mockResolvedValue({ ok: false, message: 'x' });
	render(<BlockedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getByRole('button', { name: 'Unblock @bob' }));
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
