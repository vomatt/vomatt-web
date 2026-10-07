import { z } from 'zod';

export const emailSchema = z.object({
	email: z.string().trim().email({ message: 'common.invalidEmailAddress' }).max(254),
});

/** The backend caps display names at 100 characters. */
export const profileSchema = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, { message: 'common.required' })
		.max(100, { message: 'onboarding.displayNameTooLong' }),
});

export type EmailFormData = z.infer<typeof emailSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
