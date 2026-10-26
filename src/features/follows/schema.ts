import { z } from 'zod';

import { UserDtoSchema } from '@/schemas/user';

/** A followers or following list item: public fields plus the viewer's relation, both false on the viewer's own entry. */
export const FollowUserDtoSchema = UserDtoSchema.extend({
	isFollowing: z.boolean(),
	followsYou: z.boolean(),
});

export type FollowUserDto = z.infer<typeof FollowUserDtoSchema>;
