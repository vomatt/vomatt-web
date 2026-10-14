import { z } from 'zod';

/** A `/users/search` item: public profile fields only. */
export const UserDtoSchema = z.object({
	id: z.string(),
	username: z.string(),
	// nullish: tolerate the API leaving out an empty field
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
});

export const UserProfileSchema = z.object({
	username: z.string(),
	displayName: z.string().nullable(),
	bio: z.string().nullable(),
	joinedAt: z.string().datetime({ offset: true }),
	totalPolls: z.number().int(),
	totalVotes: z.number().int(),
	avatarUrl: z.string().nullable(),
	followersCount: z.number().int(),
	followingCount: z.number().int(),
	isFollowing: z.boolean().optional(),
});

export const UpdateProfileRequestSchema = z.object({
	displayName: z.string().nullable().optional(),
	bio: z.string().nullable().optional(),
});

export const UserSummarySchema = z.object({
	username: z.string(),
	displayName: z.string().nullable(),
	avatarUrl: z.string().nullable(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
