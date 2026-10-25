import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import FollowUserButton from '@/app/(frontend)/[slug]/_components/FollowUserButton';
import { followUser, unfollowUser } from '@/features/follows/service';

jest.mock('@/contexts/LanguageContext', () => require('../../helpers/mockLanguage'));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('@/features/follows/service', () => ({ followUser: jest.fn(), unfollowUser: jest.fn() }));

const mockFollow = followUser as jest.Mock;
const mockUnfollow = unfollowUser as jest.Mock;

beforeEach(() => jest.resetAllMocks());

it('follows the user by id and reports it', async () => {
	mockFollow.mockResolvedValue({ ok: true, data: undefined });
	const onChange = jest.fn();
	render(<FollowUserButton userId="u1" username="bob" isFollowing={false} onChange={onChange} />);

	fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
	await waitFor(() => expect(mockFollow).toHaveBeenCalledWith('u1'));
	await waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
	expect(toast.success).toHaveBeenCalled();
});

it('unfollows a followed user', async () => {
	mockUnfollow.mockResolvedValue({ ok: true, data: undefined });
	const onChange = jest.fn();
	render(<FollowUserButton userId="u1" username="bob" isFollowing onChange={onChange} />);

	fireEvent.click(screen.getByRole('button', { name: 'Unfollow' }));
	await waitFor(() => expect(mockUnfollow).toHaveBeenCalledWith('u1'));
	await waitFor(() => expect(onChange).toHaveBeenCalledWith(false));
});

it('says so when the follow fails and keeps the state', async () => {
	mockFollow.mockResolvedValue({ ok: false, message: 'x' });
	const onChange = jest.fn();
	render(<FollowUserButton userId="u1" username="bob" isFollowing={false} onChange={onChange} />);

	fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Couldn’t follow. Try again.', { duration: Infinity }));
	expect(onChange).not.toHaveBeenCalled();
});
