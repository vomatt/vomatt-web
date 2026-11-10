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
});

export const CommunityMemberSchema = z.object({
	userId: z.string(),
	username: z.string(),
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
	role: CommunityRoleSchema,
	joinedAt: z.string(),
});

export type CommunityRole = z.infer<typeof CommunityRoleSchema>;
export type MyCommunity = z.infer<typeof MyCommunitySchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;

export const communityMembersHref = (communityId: string) => `/settings/communities/${encodeURIComponent(communityId)}/members`;
