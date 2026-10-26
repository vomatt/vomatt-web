export interface UserProfile {
	id: string;
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
	avatarUrl: string | null; // `bot:<kind>`; older accounts may hold an image URL
	followersCount?: number;
	followingCount?: number;
	/** Whether the viewer follows / has blocked this user; null when signed out, false on their own profile. */
	isFollowing: boolean | null;
	isBlocked: boolean | null;
	/** Whether this user follows the viewer; null when signed out, false on their own profile. */
	followsYou?: boolean | null;
	/** Followers of this user whom the viewer follows; null when signed out and on their own profile. */
	mutualFollowersCount?: number | null;
	/** The first 3 of them. */
	mutualFollowersPreview?: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null }[] | null;
}

/** Response from GET /users/me — the authenticated user's own profile. */
export interface MyProfile {
	id: string;
	username: string;
	email: string | null;
	phoneNumber: string | null;
	firstName: string | null;
	lastName: string | null;
	birthday: string | null; // yyyy-MM-dd
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
	/** Whether a first Ballot is Anonymous unless the voter says otherwise. */
	anonymousBallotByDefault: boolean;
	avatarUrl: string | null; // `bot:<kind>`; older accounts may hold an image URL
}
