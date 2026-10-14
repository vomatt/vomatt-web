export interface UserProfile {
	username: string;
	displayName: string | null;
	bio: string | null;
	joinedAt: string; // ISO date string
	totalPolls: number;
	totalVotes: number;
	// Null when the owner keeps them hidden (the default) or never set them
	location?: string | null;
	points?: number | null;
	membershipLevel?: string | null;
	// Absent until the backend ships avatars and follows; the UI hides those features then.
	avatarUrl?: string | null;
	followersCount?: number;
	followingCount?: number;
	isFollowing?: boolean; // only present when request includes Authorization header
}

/** Response from GET /users/me — the authenticated user's own profile. */
export interface MyProfile {
	id: string;
	username: string;
	email: string | null;
	phoneNumber: string | null;
	firstName: string | null;
	lastName: string | null;
	displayName: string | null;
	bio: string | null;
	location: string | null;
	points: number;
	membershipLevel: string | null;
	active: boolean;
	lastLoginAt: string | null; // ISO date string
	joinedAt: string; // ISO date string
	totalPolls: number;
	totalVotes: number;
	visibilitySettings: Record<string, boolean>;
	avatarUrl?: string | null; // absent until the backend ships avatars
}

export interface UserSummary {
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
}
