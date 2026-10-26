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
	// Not sent yet (see docs/release/api-integration-notes.md, round 3); the UI shows each once it arrives
	followersCount?: number;
	followingCount?: number;
	/** Whether the viewer follows / has blocked this user; null when signed out, false on their own profile. */
	isFollowing: boolean | null;
	isBlocked: boolean | null;
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
