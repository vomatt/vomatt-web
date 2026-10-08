import { apiClient, publicFetch } from '@/lib/api/client';
import {
  deleteMyAccount,
  deleteUser,
  followUser,
  getUserProfile,
  removeAvatar,
  searchUsers,
  unfollowUser,
} from '@/lib/api/services/users';

const mockUpdateTag = jest.fn();
jest.mock('next/cache', () => ({
  updateTag: (...a: unknown[]) => mockUpdateTag(...a),
  revalidateTag: jest.fn(),
}));
const mockClearAuthTokens = jest.fn();
jest.mock('@/lib/api/auth', () => ({ clearAuthTokens: () => mockClearAuthTokens() }));
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({ redirect: (...a: unknown[]) => mockRedirect(...a) }));

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
  publicFetch: jest.fn(),
  API_BASE_PATH: '/api',
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
      expect.stringContaining('/users/alice'),
      expect.anything()
    );
  });
});

describe('searchUsers()', () => {
  it('sends GET with username query param', async () => {
    await searchUsers('bob');
    expect(mockApiClient).toHaveBeenCalledWith(
      '/users/search?username=bob'
    );
  });

  it('includes page param when provided', async () => {
    await searchUsers('bob', 2);
    expect(mockApiClient).toHaveBeenCalledWith(
      '/users/search?username=bob&page=2'
    );
  });

  it('includes size param when provided', async () => {
    await searchUsers('bob', 0, 20);
    expect(mockApiClient).toHaveBeenCalledWith(
      '/users/search?username=bob&page=0&size=20'
    );
  });
});

describe('deleteUser()', () => {
  it('sends DELETE to /users/{userId}', async () => {
    await deleteUser('user-123');
    expect(mockApiClient).toHaveBeenCalledWith('/users/user-123', {
      method: 'DELETE',
    });
  });
});

describe('removeAvatar()', () => {
  it('sends DELETE to /users/me/avatar', async () => {
    await removeAvatar();
    expect(mockApiClient).toHaveBeenCalledWith('/users/me/avatar', {
      method: 'DELETE',
    });
  });
});

describe('followUser()', () => {
  it('sends POST to /users/{username}/follow', async () => {
    await followUser('carol');
    expect(mockApiClient).toHaveBeenCalledWith('/users/carol/follow', {
      method: 'POST',
    });
  });
});

describe('unfollowUser()', () => {
  it('sends DELETE to /users/{username}/follow', async () => {
    await unfollowUser('carol');
    expect(mockApiClient).toHaveBeenCalledWith('/users/carol/follow', {
      method: 'DELETE',
    });
  });
});

describe('deleteMyAccount()', () => {
  it('deletes the signed-in user by id, clears cookies and goes home', async () => {
    mockApiClient.mockResolvedValueOnce({ id: 'user-7' }).mockResolvedValueOnce(undefined);
    await deleteMyAccount();
    expect(mockApiClient).toHaveBeenNthCalledWith(1, '/users/me');
    expect(mockApiClient).toHaveBeenLastCalledWith('/users/user-7', { method: 'DELETE' });
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/?account_deleted=1');
  });

  it('keeps the session when the API refuses', async () => {
    mockClearAuthTokens.mockClear();
    mockApiClient.mockRejectedValueOnce(new Error('nope'));
    expect(await deleteMyAccount()).toEqual({ ok: false, message: 'nope' });
    expect(mockClearAuthTokens).not.toHaveBeenCalled();
  });
});
