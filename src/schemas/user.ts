import { z } from 'zod';

/** A `/users/search` item: public profile fields only. */
export const UserDtoSchema = z.object({
	id: z.string(),
	username: z.string(),
	// nullish: tolerate the API leaving out an empty field
	displayName: z.string().nullish(),
	avatarUrl: z.string().nullish(),
	/** A community account (a group's page), shown with a badge. */
	community: z.boolean().optional(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;
