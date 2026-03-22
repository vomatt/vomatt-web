import { z } from 'zod';

export const nameValidation =
	/^[\w'\-,.]*[^_!¡?÷?¿/\\+=@#$%ˆ&*(){}|~<>;:[\]]*$/;

export const loginSchema = z.object({
	email: z.string().email({ message: 'common.invalidEmailAddress' }),
});

export const signupSchema = z.object({
	email: z.string().email({ message: 'common.invalidEmailAddress' }).trim(),
	firstName: z
		.string()
		.min(1, { message: 'common.required' })
		.regex(nameValidation, { message: 'common.invalidName' }),
	lastName: z
		.string()
		.min(1, { message: 'common.required' })
		.regex(nameValidation, { message: 'common.invalidName' }),
	username: z
		.string()
		.min(3, { message: 'common.required' })
		.regex(/^[a-zA-Z0-9._]+$/, { message: 'common.invalidUsername' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
