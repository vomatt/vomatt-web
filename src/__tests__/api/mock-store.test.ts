import type { UserSummary } from '@/types/user';

describe('mock store helpers', () => {
  let store: typeof import('@/app/api/v1/users/_mock-store');

  beforeEach(() => {
    // jest.resetModules() ensures the module-level seed code re-runs on each require(),
    // giving every test a clean, fully-seeded store with no leftover mutations.
    jest.resetModules();
    store = require('@/app/api/v1/users/_mock-store');
  });

  afterEach(() => {
    // No manual cleanup needed: jest.resetModules() + require() in beforeEach re-evaluates
    // the module from scratch each time, so the module-level seed code always re-runs.
  });

  describe('MOCK_USERS', () => {
    it('has 5 seeded users', () => {
      expect(store.MOCK_USERS).toHaveLength(5);
    });

    it('every user has required fields', () => {
      for (const u of store.MOCK_USERS) {
        expect(u).toHaveProperty('username');
        expect(u).toHaveProperty('joinedAt');
        expect(typeof u.totalPolls).toBe('number');
        expect(typeof u.totalVotes).toBe('number');
      }
    });
  });

  describe('follow graph', () => {
    it('getFollowersCount returns 0 for user with no followers', () => {
      expect(store.getFollowersCount('nobody')).toBe(0);
    });

    it('getFollowingCount returns 0 for user following nobody', () => {
      expect(store.getFollowingCount('nobody')).toBe(0);
    });

    it('isFollowing returns false when not following', () => {
      expect(store.isFollowing('alice', 'nobody')).toBe(false);
    });

    it('isFollowing returns true for seeded relationship', () => {
      expect(store.isFollowing('alice', 'bob')).toBe(true);
    });

    it('getFollowersList length equals getFollowersCount', () => {
      const list = store.getFollowersList('alice');
      const count = store.getFollowersCount('alice');
      expect(count).toBe(list.length);
    });

    it('getFollowingList returns array of strings', () => {
      const list = store.getFollowingList('alice');
      expect(Array.isArray(list)).toBe(true);
      list.forEach((u: string) => expect(typeof u).toBe('string'));
    });
  });

  describe('getEnrichedProfile', () => {
    it('returns null for unknown username', () => {
      expect(store.getEnrichedProfile('nobody', null)).toBeNull();
    });

    it('returns profile with derived follower and following counts', () => {
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile).not.toBeNull();
      expect(typeof profile!.followersCount).toBe('number');
      expect(typeof profile!.followingCount).toBe('number');
    });

    it('followersCount matches getFollowersList length — not a hardcoded value', () => {
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile!.followersCount).toBe(store.getFollowersList('alice').length);
    });

    it('includes isFollowing when callerUsername is provided', () => {
      const profile = store.getEnrichedProfile('alice', 'bob');
      expect(profile).toHaveProperty('isFollowing');
    });

    it('does not include isFollowing when callerUsername is null', () => {
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile!.isFollowing).toBeUndefined();
    });

    it('avatarUrl comes from avatars map', () => {
      store.avatars.set('alice', 'data:image/png;base64,abc');
      const profile = store.getEnrichedProfile('alice', null);
      expect(profile!.avatarUrl).toBe('data:image/png;base64,abc');
    });

    it('avatarUrl is null when no avatar uploaded', () => {
      const profile = store.getEnrichedProfile('bob', null);
      expect(profile!.avatarUrl).toBeNull();
    });
  });

  describe('getUserSummaries', () => {
    it('returns UserSummary list for valid usernames', () => {
      const summaries = store.getUserSummaries(['alice', 'bob']);
      expect(summaries).toHaveLength(2);
      summaries.forEach((s: UserSummary) => {
        expect(s).toHaveProperty('username');
        expect(s).toHaveProperty('displayName');
        expect(s).toHaveProperty('avatarUrl');
      });
    });

    it('skips unknown usernames', () => {
      const summaries = store.getUserSummaries(['alice', 'nobody']);
      expect(summaries).toHaveLength(1);
      expect(summaries[0].username).toBe('alice');
    });

    it('returns empty array for empty input', () => {
      expect(store.getUserSummaries([])).toEqual([]);
    });
  });
});
