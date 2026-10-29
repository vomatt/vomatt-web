import type { UserDto } from '@/schemas/user';

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
	followersCount: number;
	followingCount: number;
	/** Whether the viewer follows / has blocked this user, and whether they follow the viewer; null when signed out, false on their own profile. */
	isFollowing: boolean | null;
	followsYou: boolean | null;
	isBlocked: boolean | null;
	/** The people the viewer follows who follow this user, and the first 3 of them ([] when none); null when signed out and on their own profile. */
	mutualFollowersCount: number | null;
	mutualFollowersPreview: UserDto[] | null;
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
	followersCount: number;
	followingCount: number;
	visibilitySettings: Record<string, boolean>;
	/** Whether a first Ballot is Anonymous unless the voter says otherwise. */
	anonymousBallotByDefault: boolean;
	avatarUrl: string | null; // `bot:<kind>`; older accounts may hold an image URL
}

/** A passkey on the signed-in account. */
export interface Passkey {
	id: string;
	name: string | null;
	createdAt: string;
	/** Null until it is used to sign in */
	lastUsedAt: string | null;
	/** How the browser reaches the authenticator (internal, hybrid, usb...); empty when not reported */
	transports: string[];
}

/** A device the user is signed in on; the fields the API did not record for an older sign-in are null. */
export interface SignedInSession {
	sessionId: string;
	/** Raw User-Agent: parse it for display */
	userAgent: string | null;
	createdAt: string | null;
	/** Latest sign-in or refresh, accurate to about 15 minutes */
	lastSeenAt: string | null;
	/** The session making the request */
	current: boolean;
	adminScope: boolean;
}
