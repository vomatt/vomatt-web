import { z } from 'zod';

/** Most powerful first; the order members' roles are listed and offered in. */
export const OFFICIAL_ROLES = ['OWNER', 'ADMIN', 'CHIEF_EDITOR', 'EDITOR', 'ANALYST'] as const;
export const OfficialRoleSchema = z.enum(OFFICIAL_ROLES);

/** An official account the caller belongs to, with the caller's role in it. */
export const MyOfficialSchema = z.object({
	officialId: z.string(),
	username: z.string(),
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
	role: OfficialRoleSchema,
});

export const OfficialMemberSchema = z.object({
	userId: z.string(),
	username: z.string(),
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
	role: OfficialRoleSchema,
	joinedAt: z.string(),
});

export type OfficialRole = z.infer<typeof OfficialRoleSchema>;
export type MyOfficial = z.infer<typeof MyOfficialSchema>;
export type OfficialMember = z.infer<typeof OfficialMemberSchema>;

export const officialMembersHref = (officialId: string) => `/settings/officials/${encodeURIComponent(officialId)}/members`;
