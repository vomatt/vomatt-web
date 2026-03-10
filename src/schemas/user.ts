import { z } from 'zod';

export const UserProfileSchema = z.object({
	username: z.string(),
	displayName: z.string().nullable(),
	bio: z.string().nullable(),
	joinedAt: z.string().datetime({ offset: true }),
	totalPolls: z.number().int(),
	totalVotes: z.number().int(),
});

export const UpdateProfileRequestSchema = z.object({
	displayName: z.string().nullable().optional(),
	bio: z.string().nullable().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
