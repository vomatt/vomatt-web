import { z } from 'zod';

export const UserDtoSchema = z.object({
	id: z.string(),
	username: z.string(),
	email: z.string().optional(),
	phoneNumber: z.string().optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	location: z.string().optional(),
	points: z.number().int().optional(),
	membershipLevel: z.string().optional(),
	active: z.boolean().optional(),
	createdAt: z.string().datetime({ offset: true }).optional(),
	lastLoginAt: z.string().datetime({ offset: true }).optional(),
});

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

export type UserDto = z.infer<typeof UserDtoSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
