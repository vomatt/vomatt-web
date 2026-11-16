import { z } from 'zod';

import { UserDtoSchema } from '@/schemas/user';

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
	avatarUrl: z.string().nullish(),
	role: CommunityRoleSchema,
	joinedAt: z.string(),
});

/** A pending invitation to join, sent by id (`userId` and username) or by address (`email`); the invitee is a member only after accepting. */
export const CommunityInvitationSchema = z.object({
	id: z.string(),
	userId: z.string().nullish(),
	username: z.string().nullish(),
	avatarUrl: z.string().nullish(),
	email: z.string().nullish(),
	role: CommunityRoleSchema,
	invitedAt: z.string(),
	expiresAt: z.string(),
});

/** An invitation to the signed-in person, as its own page shows it; the API may not name the inviter. */
export const CommunityInvitationDetailSchema = z.object({
	id: z.string(),
	role: CommunityRoleSchema,
	expiresAt: z.string(),
	community: UserDtoSchema,
	inviter: UserDtoSchema.nullish(),
	// Accept answers 403 community.locked until an owner unlocks it
	locked: z.boolean().default(false),
	// Already in it: accepting keeps their role
	member: z.boolean().default(false),
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
export type CommunityInvitation = z.infer<typeof CommunityInvitationSchema>;
export type CommunityInvitationDetail = z.infer<typeof CommunityInvitationDetailSchema>;
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;

export const communityMembersHref = (communityId: string) => `/settings/communities/${encodeURIComponent(communityId)}/members`;

/** Where an invitation's own page lives; log in names it as the redirect for someone the invitation email sent there. */
export const COMMUNITY_INVITATIONS_PATH = '/notifications/community-invitations/';
export const communityInvitationHref = (invitationId: string) => `${COMMUNITY_INVITATIONS_PATH}${encodeURIComponent(invitationId)}`;
