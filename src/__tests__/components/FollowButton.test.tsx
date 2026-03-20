import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';

jest.mock('@/lib/api/services/users', () => ({
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
}));

import FollowButton from '@/app/(frontend)/profile/[username]/_components/FollowButton';
const { followUser, unfollowUser } = require('@/lib/api/services/users');

beforeEach(() => {
  jest.clearAllMocks();
  followUser.mockResolvedValue({ following: true });
  unfollowUser.mockResolvedValue({ following: false });
});

describe('FollowButton', () => {
  it('renders Follow button when not following', () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
  });

  it('renders Unfollow button when already following', () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={true}
        initialFollowersCount={10}
      />
    );
    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument();
  });

  it('displays the initial followers count', () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={42}
      />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('optimistically increments count and shows Unfollow', async () => {
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^follow$/i }));
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unfollow/i })).toBeInTheDocument();
    await waitFor(() => expect(followUser).toHaveBeenCalledWith('alice'));
  });

  it('reverts count and state when followUser throws', async () => {
    followUser.mockRejectedValue(new Error('Network error'));
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^follow$/i }));
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
    });
  });

  it('disables the button while the request is in flight', async () => {
    let resolve!: () => void;
    followUser.mockReturnValue(new Promise<void>((res) => { resolve = res; }));
    render(
      <FollowButton
        username="alice"
        initialIsFollowing={false}
        initialFollowersCount={10}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^follow$/i }));
    expect(screen.getByRole('button', { name: /follow/i })).toBeDisabled();
    await act(async () => { resolve(); });
  });
});
