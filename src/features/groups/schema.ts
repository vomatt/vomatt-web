import { z } from 'zod';

const DateTime = z.string().datetime({ offset: true });

export const GROUP_NAME_MAX = 50;

/** A private, reusable invite list. Only its owner ever sees it. */
export const GroupSchema = z.object({
	id: z.string(),
	name: z.string(),
	memberCount: z.number().int(),
	createdAt: DateTime,
});

/**
 * A user added by ID (`userId`, `username`), or an email address (`email`;
 * never says whether it belongs to an account).
 */
export const GroupMemberSchema = z.object({
	userId: z.string().nullable(),
	username: z.string().nullable(),
	email: z.string().nullable(),
	addedAt: DateTime,
});

export type Group = z.infer<typeof GroupSchema>;
export type GroupMember = z.infer<typeof GroupMemberSchema>;
