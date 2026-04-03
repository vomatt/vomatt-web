import { apiClient, publicFetch } from '@/lib/api/client';

import {
  deleteUser,
  followUser,
  getUserProfile,
  removeAvatar,
  searchUsers,
  unfollowUser,
} from '@/lib/api/services/users';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
  publicFetch: jest.fn(),
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;
const mockPublicFetch = publicFetch as jest.MockedFunction<typeof publicFetch>;

beforeEach(() => {
  mockApiClient.mockClear().mockResolvedValue(undefined);
  mockPublicFetch.mockClear().mockResolvedValue(undefined);
  process.env.API_URL = 'https://example.com';
});

describe('getUserProfile()', () => {
  it('uses publicFetch (unauthenticated), not apiClient', async () => {
    await getUserProfile('alice');
    expect(mockPublicFetch).toHaveBeenCalled();
    expect(mockApiClient).not.toHaveBeenCalled();
  });

  it('calls the correct URL', async () => {
    await getUserProfile('alice');
    expect(mockPublicFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/alice'),
      expect.anything()
    );
  });
});

describe('searchUsers()', () => {
  it('sends GET with username query param', async () => {
    await searchUsers('bob');
    expect(mockApiClient).toHaveBeenCalledWith(
      '/api/v1/users/search?username=bob'
    );
  });

  it('includes page param when provided', async () => {
    await searchUsers('bob', 2);
    expect(mockApiClient).toHaveBeenCalledWith(
      '/api/v1/users/search?username=bob&page=2'
    );
  });

  it('includes size param when provided', async () => {
    await searchUsers('bob', 0, 20);
    expect(mockApiClient).toHaveBeenCalledWith(
      '/api/v1/users/search?username=bob&page=0&size=20'
    );
  });
});

describe('deleteUser()', () => {
  it('sends DELETE to /api/v1/users/{userId}', async () => {
    await deleteUser('user-123');
    expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/user-123', {
      method: 'DELETE',
    });
  });
});

describe('removeAvatar()', () => {
  it('sends DELETE to /api/v1/users/me/avatar', async () => {
    await removeAvatar();
    expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/me/avatar', {
      method: 'DELETE',
    });
  });
});

describe('followUser()', () => {
  it('sends POST to /api/v1/users/{username}/follow', async () => {
    await followUser('carol');
    expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/carol/follow', {
      method: 'POST',
    });
  });
});

describe('unfollowUser()', () => {
  it('sends DELETE to /api/v1/users/{username}/follow', async () => {
    await unfollowUser('carol');
    expect(mockApiClient).toHaveBeenCalledWith('/api/v1/users/carol/follow', {
      method: 'DELETE',
    });
  });
});
