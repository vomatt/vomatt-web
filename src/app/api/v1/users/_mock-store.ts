import type { UserProfile, UserSummary } from '@/types/user';

// ─── In-memory state ─────────────────────────────────────────────────────────

/** username → base64 data URL */
export const avatars = new Map<string, string>();

/** follower username → Set of followee usernames */
export const follows = new Map<string, Set<string>>();

// ─── Seeded data ──────────────────────────────────────────────────────────────

type SeedUser = Omit<UserProfile, 'followersCount' | 'followingCount' | 'isFollowing' | 'avatarUrl'>;

export const MOCK_USERS: SeedUser[] = [
  {
    username: 'alice',
    displayName: 'Alice Chen',
    bio: 'Poll enthusiast and community builder',
    joinedAt: '2024-01-15T00:00:00Z',
    totalPolls: 12,
    totalVotes: 88,
  },
  {
    username: 'bob',
    displayName: 'Bob Kim',
    bio: 'Data lover. I vote on everything.',
    joinedAt: '2024-02-20T00:00:00Z',
    totalPolls: 5,
    totalVotes: 42,
  },
  {
    username: 'carol',
    displayName: 'Carol Wu',
    bio: null,
    joinedAt: '2024-03-10T00:00:00Z',
    totalPolls: 3,
    totalVotes: 15,
  },
  {
    username: 'dave',
    displayName: null,
    bio: 'Just here to vote',
    joinedAt: '2024-04-01T00:00:00Z',
    totalPolls: 0,
    totalVotes: 30,
  },
  {
    username: 'eva',
    displayName: 'Eva Martinez',
    bio: 'Community builder | 20+ polls created',
    joinedAt: '2024-05-05T00:00:00Z',
    totalPolls: 20,
    totalVotes: 200,
  },
];

// Seed follow relationships so initial counts are non-zero
follows.set('alice', new Set(['bob', 'carol', 'eva']));
follows.set('bob', new Set(['alice', 'eva']));
follows.set('carol', new Set(['alice']));
follows.set('eva', new Set(['alice', 'bob', 'carol', 'dave']));

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function getFollowersCount(username: string): number {
  let count = 0;
  for (const followees of follows.values()) {
    if (followees.has(username)) count++;
  }
  return count;
}

export function getFollowingCount(username: string): number {
  return follows.get(username)?.size ?? 0;
}

export function isFollowing(follower: string, followee: string): boolean {
  return follows.get(follower)?.has(followee) ?? false;
}

/** Returns usernames of everyone who follows `username` */
export function getFollowersList(username: string): string[] {
  const result: string[] = [];
  for (const [follower, followees] of follows.entries()) {
    if (followees.has(username)) result.push(follower);
  }
  return result;
}

/** Returns usernames of everyone `username` follows */
export function getFollowingList(username: string): string[] {
  return Array.from(follows.get(username) ?? []);
}

/**
 * Build a full UserProfile for the given username, enriched with live counts.
 * Returns null if the username is not in MOCK_USERS.
 * Counts are always derived from the `follows` Map — never hardcoded.
 * If callerUsername is provided, includes isFollowing.
 */
export function getEnrichedProfile(
  username: string,
  callerUsername: string | null
): UserProfile | null {
  const seed = MOCK_USERS.find((u) => u.username === username);
  if (!seed) return null;

  const profile: UserProfile = {
    ...seed,
    avatarUrl: avatars.get(username) ?? null,
    followersCount: getFollowersCount(username),
    followingCount: getFollowingCount(username),
  };

  if (callerUsername !== null) {
    profile.isFollowing = isFollowing(callerUsername, username);
  }

  return profile;
}

/** Convert a list of usernames into UserSummary objects. Skips unknowns. */
export function getUserSummaries(usernames: string[]): UserSummary[] {
  return usernames.flatMap((username) => {
    const seed = MOCK_USERS.find((u) => u.username === username);
    if (!seed) return [];
    return [
      {
        username: seed.username,
        displayName: seed.displayName,
        avatarUrl: avatars.get(username) ?? null,
      },
    ];
  });
}
