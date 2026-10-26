import { z } from 'zod';

/** A `/users/search` item: public profile fields only. */
export const UserDtoSchema = z.object({
	id: z.string(),
	username: z.string(),
	// nullish: tolerate the API leaving out an empty field
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
});

/** A follower / following list item: a `UserDto` plus the caller's relation to the user (both false on the caller's own entry). */
export const FollowUserDtoSchema = UserDtoSchema.extend({
	// default: one item missing a flag shouldn't fail the whole page
	isFollowing: z.boolean().default(false),
	followsYou: z.boolean().default(false),
});

export const UserSummarySchema = z.object({
	username: z.string(),
	displayName: z.string().nullable(),
	avatarUrl: z.string().nullable(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;
export type FollowUserDto = z.infer<typeof FollowUserDtoSchema>;
