export interface UserProfile {
  username: string;
  displayName: string | null;
  bio: string | null;
  joinedAt: string; // ISO date string
  totalPolls: number;
  totalVotes: number;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean; // only present when request includes Authorization header
}

export interface UserSummary {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}
