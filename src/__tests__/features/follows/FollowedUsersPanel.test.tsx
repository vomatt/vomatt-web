import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { FollowedUsersPanel } from '@/features/follows/FollowedUsersPanel';
import { getFollowedUsers, unfollowUser } from '@/features/follows/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/follows/service', () => ({ getFollowedUsers: jest.fn(), unfollowUser: jest.fn() }));

const mockGet = getFollowedUsers as jest.Mock;
const mockUnfollow = unfollowUser as jest.Mock;
const bob = { id: 'u1', username: 'bob', displayName: 'Bob', avatarUrl: 'bot:boba' };
const cy = { id: 'u2', username: 'cy', displayName: null, avatarUrl: null };

beforeEach(() => jest.resetAllMocks());

it('shows the empty state', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } });
	render(<FollowedUsersPanel />);
	expect(await screen.findByText('You aren’t following anyone.')).toBeInTheDocument();
});

it('offers Try again when loading fails', async () => {
	mockGet.mockResolvedValueOnce({ ok: false, message: 'x' });
	render(<FollowedUsersPanel />);
	expect(await screen.findByText('Couldn’t load followed users.')).toBeInTheDocument();

	mockGet.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: null } });
	fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
	expect(await screen.findByText('@bob')).toBeInTheDocument();
});

it('unfollows a user and drops them from the list', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob, cy], nextCursor: null } });
	mockUnfollow.mockResolvedValue({ ok: true, data: undefined });
	render(<FollowedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getAllByRole('button', { name: 'Unfollow' })[0]);
	await waitFor(() => expect(screen.queryByText('@bob')).not.toBeInTheDocument());
	expect(mockUnfollow).toHaveBeenCalledWith('u1');
	expect(screen.getByText('@cy')).toBeInTheDocument();
});

it('keeps the user and says so when unfollowing fails', async () => {
	mockGet.mockResolvedValue({ ok: true, data: { items: [bob], nextCursor: null } });
	mockUnfollow.mockResolvedValue({ ok: false, message: 'x' });
	render(<FollowedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getByRole('button', { name: 'Unfollow' }));
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t unfollow. Try again.', { duration: Infinity }));
	expect(screen.getByText('@bob')).toBeInTheDocument();
});

it('loads more with the cursor', async () => {
	mockGet
		.mockResolvedValueOnce({ ok: true, data: { items: [bob], nextCursor: 'c2' } })
		.mockResolvedValueOnce({ ok: true, data: { items: [cy], nextCursor: null } });
	render(<FollowedUsersPanel />);
	await screen.findByText('@bob');

	fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
	expect(await screen.findByText('@cy')).toBeInTheDocument();
	expect(mockGet).toHaveBeenLastCalledWith('c2');
});
