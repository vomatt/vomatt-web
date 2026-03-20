import { render, screen, waitFor } from '@testing-library/react';

jest.mock('@/lib/api/users-public', () => ({
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import FollowersSheet from '@/app/(frontend)/profile/[username]/_components/FollowersSheet';
const { getFollowers, getFollowing } = require('@/lib/api/users-public');

const mockPage = {
  content: [{ username: 'bob', displayName: 'Bob Kim', avatarUrl: null }],
  totalElements: 1,
  totalPages: 1,
  size: 20,
};

beforeEach(() => {
  jest.clearAllMocks();
  getFollowers.mockResolvedValue(mockPage);
  getFollowing.mockResolvedValue(mockPage);
});

describe('FollowersSheet', () => {
  it('does not show list content when closed', () => {
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={false}
        onOpenChange={jest.fn()}
      />
    );
    expect(screen.queryByText('Bob Kim')).toBeNull();
  });

  it('fetches and shows followers when opened', async () => {
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getByText('Bob Kim')).toBeInTheDocument()
    );
    expect(getFollowers).toHaveBeenCalledWith('alice', 0);
  });

  it('calls getFollowing when type is "following"', async () => {
    render(
      <FollowersSheet
        username="alice"
        type="following"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() => expect(getFollowing).toHaveBeenCalledWith('alice', 0));
  });

  it('shows empty state message when list is empty', async () => {
    getFollowers.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, size: 20 });
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getByText(/no followers yet/i)).toBeInTheDocument()
    );
  });

  it('shows error message on fetch failure', async () => {
    getFollowers.mockRejectedValue(new Error('Network error'));
    render(
      <FollowersSheet
        username="alice"
        type="followers"
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    );
  });
});
