import { z } from 'zod';

export const emailSchema = z.object({
	email: z.string().trim().email({ message: 'common.invalidEmailAddress' }).max(254),
});

/** The backend caps each name at 50 characters; a last name is optional, since not everyone has one. */
export const profileSchema = z.object({
	// The inputs stop at 50 characters, so the caps need no message of their own
	firstName: z.string().trim().min(1, { message: 'common.required' }).max(50),
	lastName: z.string().trim().max(50),
});

export type EmailFormData = z.infer<typeof emailSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
