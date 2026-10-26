import { apiClient, ApiError, publicFetch } from '@/lib/api/client';
import {
  deleteMyAccount,
  deleteUser,
  editProfile,
  getUserProfile,
  getUserProfileForViewer,
  searchUsers,
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
jest.mock('next/navigation', () => ({
  redirect: (...a: unknown[]) => mockRedirect(...a),
  unstable_rethrow: jest.fn(),
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
  publicFetch: jest.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public statusCode: number,
      public data?: any
    ) {
      super(message);
    }
  },
  AuthError: class AuthError extends Error {},
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
  it('sends the session when there is one, so the viewer flags are filled', async () => {
    await getUserProfile('alice');
    expect(mockApiClient).toHaveBeenCalledWith(
      '/users/alice',
      expect.objectContaining({ auth: 'optional' })
    );
  });

  it('returns null for an unknown username', async () => {
    mockApiClient.mockRejectedValueOnce(new ApiError('nope', 404));
    expect(await getUserProfile('ghost')).toBeNull();
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

  it('leaves cached profiles alone for the private Ballot default', async () => {
    expect(await editProfile({ anonymousBallotByDefault: true })).toEqual({ ok: true });
    expect(mockUpdateTag).not.toHaveBeenCalled();
    expect(mockRevalidateTag).not.toHaveBeenCalled();
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

describe('getUserProfileForViewer()', () => {
  it('asks with the session, uncached, so the relation is the viewer\'s', async () => {
    mockApiClient.mockResolvedValueOnce({ id: 'u1', username: 'mei', isFollowing: true });
    expect(await getUserProfileForViewer('mei')).toMatchObject({ isFollowing: true });
    expect(mockApiClient).toHaveBeenCalledWith('/users/mei', { auth: 'optional', cache: 'no-store' });
  });

  it('returns null for a username no one uses', async () => {
    mockApiClient.mockRejectedValueOnce(new ApiError('gone', 404));
    expect(await getUserProfileForViewer('nobody')).toBeNull();
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

  it("returns the API's errorCode, e.g. when the caller is the only active admin", async () => {
    mockClearAuthTokens.mockClear();
    mockApiClient
      .mockResolvedValueOnce({ id: 'user-7' })
      .mockRejectedValueOnce(new ApiError('Last admin', 409, { errorCode: 'admin.last_admin' }));
    expect(await deleteMyAccount()).toEqual({
      ok: false,
      status: 409,
      errorCode: 'admin.last_admin',
      message: 'Last admin',
    });
    expect(mockClearAuthTokens).not.toHaveBeenCalled();
  });
});
