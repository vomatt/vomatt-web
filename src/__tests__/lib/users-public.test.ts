import { getFollowers, getFollowing } from '@/lib/api/users-public';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
  mockFetch.mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        data: { content: [], totalElements: 0, totalPages: 0, size: 20 },
      }),
  });
});

describe('getFollowers()', () => {
  it('calls the correct followers URL', async () => {
    await getFollowers('alice');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/alice/followers')
    );
  });

  it('includes page and size params', async () => {
    await getFollowers('alice', 2, 10);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=2&size=10')
    );
  });
});

describe('getFollowing()', () => {
  it('calls the correct following URL', async () => {
    await getFollowing('bob');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/users/bob/following')
    );
  });

  it('includes page and size params', async () => {
    await getFollowing('bob', 1, 5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('page=1&size=5')
    );
  });
});
