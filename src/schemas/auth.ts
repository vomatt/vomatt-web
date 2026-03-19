import { z } from 'zod';

export const PreSignupRequestSchema = z.object({
	email: z.string().email(),
	username: z.string().min(3),
});

export const PreSignupResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	errorType: z.string().optional(),
	sessionKey: z.string().optional(),
	expirationMinutes: z.number().int().optional(),
});

export const SignupRequestSchema = z.object({
	username: z.string().min(3).max(20),
	email: z.string().email().max(50),
	verificationCode: z.string().length(6),
	phoneNumber: z.string().max(20).optional(),
	roles: z.array(z.string()).optional(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
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
	type: z.string().optional(),
	id: z.string().optional(),
	username: z.string().optional(),
	email: z.string().optional(),
	roles: z.array(z.string()).optional(),
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
export type PreSignupResponse = z.infer<typeof PreSignupResponseSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type SigninRequest = z.infer<typeof SigninRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
