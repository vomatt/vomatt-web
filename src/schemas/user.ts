import { z } from 'zod';

/** A `/users/search` item: public profile fields only. */
export const UserDtoSchema = z.object({
	id: z.string(),
	username: z.string(),
	// nullish: tolerate the API leaving out an empty field
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
});

export const UserSummarySchema = z.object({
	username: z.string(),
	displayName: z.string().nullable(),
	avatarUrl: z.string().nullable(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;
