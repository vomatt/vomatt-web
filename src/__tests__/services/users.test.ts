import { apiClient, publicFetch } from '@/lib/api/client';
import {
  deleteMyAccount,
  deleteUser,
  editProfile,
  followUser,
  getUserProfile,
  removeAvatar,
  searchUsers,
  unfollowUser,
} from '@/lib/api/services/users';

const mockUpdateTag = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  updateTag: (...a: unknown[]) => mockUpdateTag(...a),
  revalidateTag: (...a: unknown[]) => mockRevalidateTag(...a),
}));
const mockClearAuthTokens = jest.fn();
jest.mock('@/lib/api/auth', () => ({ clearAuthTokens: () => mockClearAuthTokens() }));
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({ redirect: (...a: unknown[]) => mockRedirect(...a) }));

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
  publicFetch: jest.fn(),
  ApiError: class ApiError extends Error {},
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
  beforeEach(() => {
    mockApiClient.mockResolvedValue({
      items: [{ id: 'u1', username: 'bob', displayName: 'Bob', avatarUrl: null }],
      nextCursor: 'abc',
    });
  });

  it('asks for the first page by username', async () => {
    await searchUsers('bob');
    expect(mockApiClient).toHaveBeenCalledWith('/users/search?limit=20&username=bob');
  });

  it('passes the cursor back unchanged', async () => {
    await searchUsers('bob', 'abc', 10);
    expect(mockApiClient).toHaveBeenCalledWith(
      '/users/search?limit=10&cursor=abc&username=bob'
    );
  });

  it('returns public fields, with the next cursor', async () => {
    expect(await searchUsers('bob')).toEqual({
      items: [{ id: 'u1', username: 'bob', displayName: 'Bob', avatarUrl: null }],
      nextCursor: 'abc',
    });
  });
});

describe('editProfile()', () => {
  beforeEach(() => {
    mockUpdateTag.mockClear();
    mockRevalidateTag.mockClear();
  });

  it('sends every field in one PATCH to /users/me', async () => {
    await editProfile({ username: 'alice_c', displayName: 'Alice', bio: 'hi' });
    expect(mockApiClient).toHaveBeenCalledWith('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ username: 'alice_c', displayName: 'Alice', bio: 'hi' }),
    });
  });

  it('re-renders cached profiles when the username stays', async () => {
    expect(await editProfile({ displayName: 'Alice' })).toEqual({ ok: true });
    expect(mockUpdateTag).toHaveBeenCalledWith('profiles');
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it('only expires cached profiles when the username changes', async () => {
    expect(await editProfile({ username: 'alice_c' })).toEqual({ ok: true });
    expect(mockRevalidateTag).toHaveBeenCalledWith('profiles', { expire: 0 });
    expect(mockUpdateTag).not.toHaveBeenCalled();
  });

  it("returns the API's message instead of throwing", async () => {
    mockApiClient.mockRejectedValueOnce(new Error('Username taken'));
    expect(await editProfile({ username: 'bob' })).toEqual({ ok: false, message: 'Username taken' });
    expect(mockRevalidateTag).not.toHaveBeenCalled();
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
