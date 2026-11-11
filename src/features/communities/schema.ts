import { z } from 'zod';

/** Most powerful first; the order members' roles are listed and offered in. */
export const COMMUNITY_ROLES = ['OWNER', 'ADMIN', 'CHIEF_EDITOR', 'EDITOR', 'ANALYST'] as const;
const CommunityRoleSchema = z.enum(COMMUNITY_ROLES);
/** The role a new member, or a role change, starts on. */
export const DEFAULT_ROLE: CommunityRole = 'EDITOR';

/** A community account the caller belongs to, with the caller's role in it. */
export const MyCommunitySchema = z.object({
	communityId: z.string(),
	username: z.string(),
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
	role: CommunityRoleSchema,
	/** Readable, but it can't post or change anything except be deleted, handed over or left; missing from an older API */
	locked: z.boolean().optional(),
});

export const CommunityMemberSchema = z.object({
	userId: z.string(),
	username: z.string(),
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
	role: CommunityRoleSchema,
	joinedAt: z.string(),
});

/** The roles offered and explained in phase 1: ANALYST only reads result reports, which aren't in the app yet. */
export const OFFERED_ROLES: readonly CommunityRole[] = COMMUNITY_ROLES.filter((role) => role !== 'ANALYST');

/** Analysts only read result reports, which aren't in the app yet: acting as the account would get them nothing. */
export const canActAs = (role: CommunityRole) => OFFERED_ROLES.includes(role);

/** The name an account goes by: its display name, else its username. */
export const accountName = (account: { username: string; displayName?: string | null }) =>
	account.displayName || account.username;

export type CommunityRole = z.infer<typeof CommunityRoleSchema>;
export type MyCommunity = z.infer<typeof MyCommunitySchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;

export const communityMembersHref = (communityId: string) => `/settings/communities/${encodeURIComponent(communityId)}/members`;
