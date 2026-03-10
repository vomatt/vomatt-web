import { z } from 'zod';

export const PreSignupRequestSchema = z.object({
	email: z.string().email(),
	username: z.string().min(3),
});

export const SignupRequestSchema = z.object({
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string(),
	username: z.string().min(3),
	verificationCode: z.string(),
});

export const SigninRequestSchema = z.object({
	email: z.string().email(),
	verificationCode: z.string(),
});

export const AuthResponseSchema = z.object({
	success: z.boolean(),
	/** Short-lived JWT access token */
	token: z.string().optional(),
	refreshToken: z.string().optional(),
	errorCode: z.string().nullable().optional(),
});

export const RefreshTokenRequestSchema = z.object({
	refreshToken: z.string(),
});

export const RefreshTokenResponseSchema = z.object({
	accessToken: z.string().optional(),
	refreshToken: z.string().optional(),
	/** Present when refresh fails */
	message: z.string().nullable().optional(),
});

export type PreSignupRequest = z.infer<typeof PreSignupRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type SigninRequest = z.infer<typeof SigninRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
