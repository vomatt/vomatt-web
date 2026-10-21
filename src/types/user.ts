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
	birthday?: string | null; // yyyy-MM-dd; null while hidden
	avatarUrl: string | null; // `bot:<kind>`; older accounts may hold an image URL
	// Absent until the backend ships follows; the UI hides them then.
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

export interface UserSummary {
	username: string;
	displayName: string | null;
	avatarUrl: string | null;
}
