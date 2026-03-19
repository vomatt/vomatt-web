/**
 * Generates openapi.json from Zod schemas.
 *
 * Usage:
 *   npx tsx scripts/generate-openapi.ts
 *
 * This overwrites openapi.json at the project root.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

import {
	OpenApiGeneratorV31,
	OpenAPIRegistry,
	extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

import {
	AuthResponseSchema,
	PreSignupRequestSchema,
	RefreshTokenRequestSchema,
	RefreshTokenResponseSchema,
	SigninRequestSchema,
	SignupRequestSchema,
} from '../src/schemas/auth';
import {
	CommentSchema,
	CreateCommentRequestSchema,
	CreatePollRequestSchema,
	PageableSchema,
	PollPageSchema,
	PollPrivacyModeSchema,
	PollSchema,
	SortSchema,
} from '../src/schemas/poll';
import { UpdateProfileRequestSchema, UserProfileSchema } from '../src/schemas/user';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const registry = new OpenAPIRegistry();

// Register named schemas
registry.register('PollPrivacyMode', PollPrivacyModeSchema);
registry.register('Sort', SortSchema);
registry.register('Pageable', PageableSchema);
registry.register('Poll', PollSchema);
registry.register('PollPage', PollPageSchema);
registry.register('Comment', CommentSchema);
registry.register('CreatePollRequest', CreatePollRequestSchema);
registry.register('CreateCommentRequest', CreateCommentRequestSchema);
registry.register('UserProfile', UserProfileSchema);
registry.register('UpdateProfileRequest', UpdateProfileRequestSchema);
registry.register('PreSignupRequest', PreSignupRequestSchema);
registry.register('SignupRequest', SignupRequestSchema);
registry.register('SigninRequest', SigninRequestSchema);
registry.register('AuthResponse', AuthResponseSchema);
registry.register('RefreshTokenRequest', RefreshTokenRequestSchema);
registry.register('RefreshTokenResponse', RefreshTokenResponseSchema);

// Bearer auth
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'JWT',
});

// ---------------------------------------------------------------------------
// Auth paths
// ---------------------------------------------------------------------------
registry.registerPath({
	method: 'get',
	path: '/api/auth/generateVerificationCode',
	tags: ['auth'],
	summary: 'Request a verification code',
	request: {
		query: z.object({ email: z.string().email().openapi({ example: 'user@example.com' }) }),
	},
	responses: {
		200: {
			description: 'Code sent',
			content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
		},
	},
});

registry.registerPath({
	method: 'post',
	path: '/api/auth/pre-signup',
	tags: ['auth'],
	summary: 'Validate email and username before signup',
	request: { body: { content: { 'application/json': { schema: PreSignupRequestSchema } } } },
	responses: {
		200: {
			description: 'Availability result',
			content: {
				'application/json': {
					schema: z.object({ success: z.boolean(), message: z.string().optional() }),
				},
			},
		},
	},
});

registry.registerPath({
	method: 'post',
	path: '/api/auth/signup',
	tags: ['auth'],
	summary: 'Create a new account',
	request: { body: { content: { 'application/json': { schema: SignupRequestSchema } } } },
	responses: {
		200: {
			description: 'Registration result',
			content: { 'application/json': { schema: AuthResponseSchema } },
		},
	},
});

registry.registerPath({
	method: 'post',
	path: '/api/auth/signin',
	tags: ['auth'],
	summary: 'Sign in with email and verification code',
	request: { body: { content: { 'application/json': { schema: SigninRequestSchema } } } },
	responses: {
		200: {
			description: 'Sign-in result',
			content: { 'application/json': { schema: AuthResponseSchema } },
		},
	},
});

registry.registerPath({
	method: 'post',
	path: '/api/auth/refreshToken',
	tags: ['auth'],
	summary: 'Refresh access token',
	request: { body: { content: { 'application/json': { schema: RefreshTokenRequestSchema } } } },
	responses: {
		200: {
			description: 'New token pair or error',
			content: { 'application/json': { schema: RefreshTokenResponseSchema } },
		},
	},
});

// ---------------------------------------------------------------------------
// Polls paths
// ---------------------------------------------------------------------------
registry.registerPath({
	method: 'get',
	path: '/api/v1/votes',
	tags: ['polls'],
	summary: 'List polls (paginated, searchable)',
	request: {
		query: z.object({
			page: z.string().optional().openapi({ example: '0' }),
			q: z.string().optional(),
			sort: z.enum(['newest', 'oldest', 'popular']).optional(),
			status: z.enum(['all', 'active', 'closed']).optional(),
			creatorUsername: z.string().optional(),
		}),
	},
	responses: {
		200: {
			description: 'Paginated poll list',
			content: { 'application/json': { schema: PollPageSchema } },
		},
	},
});

registry.registerPath({
	method: 'post',
	path: '/api/v1/votes',
	tags: ['polls'],
	summary: 'Create a poll',
	security: [{ [bearerAuth.name]: [] }],
	request: { body: { content: { 'application/json': { schema: CreatePollRequestSchema } } } },
	responses: {
		200: {
			description: 'Creation result',
			content: {
				'application/json': { schema: z.object({ success: z.boolean() }) },
			},
		},
	},
});

registry.registerPath({
	method: 'get',
	path: '/api/v1/votes/{id}',
	tags: ['polls'],
	summary: 'Get a single poll',
	request: {
		params: z.object({ id: z.string().openapi({ example: 'mock-1' }) }),
	},
	responses: {
		200: {
			description: 'Poll detail',
			content: { 'application/json': { schema: PollSchema } },
		},
	},
});

registry.registerPath({
	method: 'get',
	path: '/api/v1/votes/my',
	tags: ['polls'],
	summary: "Get the authenticated user's polls",
	security: [{ [bearerAuth.name]: [] }],
	responses: {
		200: {
			description: 'Paginated poll list for the current user',
			content: { 'application/json': { schema: PollPageSchema } },
		},
	},
});

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------
registry.registerPath({
	method: 'post',
	path: '/api/v1/votes/{pollId}/options/{optionId}',
	tags: ['voting'],
	summary: 'Cast a vote on a poll option',
	security: [{ [bearerAuth.name]: [] }],
	request: {
		params: z.object({
			pollId: z.string().openapi({ example: 'mock-1' }),
			optionId: z.string().openapi({ example: 'opt-1-1' }),
		}),
	},
	responses: {
		200: {
			description: 'Vote recorded',
			content: {
				'application/json': { schema: z.object({ success: z.boolean() }) },
			},
		},
	},
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
registry.registerPath({
	method: 'get',
	path: '/api/v1/votes/{pollId}/comments',
	tags: ['comments'],
	summary: 'List comments for a poll',
	security: [{ [bearerAuth.name]: [] }],
	request: {
		params: z.object({ pollId: z.string().openapi({ example: 'mock-1' }) }),
	},
	responses: {
		200: {
			description: 'Comment list',
			content: { 'application/json': { schema: z.array(CommentSchema) } },
		},
	},
});

registry.registerPath({
	method: 'post',
	path: '/api/v1/votes/{pollId}/comments',
	tags: ['comments'],
	summary: 'Post a comment on a poll',
	security: [{ [bearerAuth.name]: [] }],
	request: {
		params: z.object({ pollId: z.string().openapi({ example: 'mock-1' }) }),
		body: { content: { 'application/json': { schema: CreateCommentRequestSchema } } },
	},
	responses: {
		200: {
			description: 'Comment created',
			content: { 'application/json': { schema: CommentSchema } },
		},
	},
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
registry.registerPath({
	method: 'get',
	path: '/api/v1/users/{username}',
	tags: ['users'],
	summary: "Get a user's public profile",
	request: {
		params: z.object({ username: z.string().openapi({ example: 'alex_dev' }) }),
	},
	responses: {
		200: {
			description: 'User profile',
			content: { 'application/json': { schema: UserProfileSchema } },
		},
		404: { description: 'User not found' },
	},
});

registry.registerPath({
	method: 'patch',
	path: '/api/v1/users/me',
	tags: ['users'],
	summary: "Update the authenticated user's profile",
	security: [{ [bearerAuth.name]: [] }],
	request: {
		body: { content: { 'application/json': { schema: UpdateProfileRequestSchema } } },
	},
	responses: {
		200: {
			description: 'Updated profile',
			content: { 'application/json': { schema: UserProfileSchema } },
		},
	},
});

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------
const generator = new OpenApiGeneratorV31(registry.definitions);

const document = generator.generateDocument({
	openapi: '3.1.0',
	info: {
		title: 'Vomatt Backend API',
		version: '1.0.0',
		description: [
			'Backend API consumed by the Next.js proxy layer (`API_URL`).',
			'All endpoints are relative to the `API_URL` environment variable',
			'(e.g. `http://localhost:8080`).',
			'',
			'**Authentication**: Protected endpoints require a Bearer JWT in the',
			'`Authorization` header.',
		].join('\n'),
	},
	servers: [{ url: '{apiUrl}', variables: { apiUrl: { default: 'http://localhost:8080' } } }],
	tags: [
		{ name: 'auth', description: 'Authentication and session management' },
		{ name: 'polls', description: 'Poll (vote) CRUD and search' },
		{ name: 'voting', description: 'Casting votes on poll options' },
		{ name: 'comments', description: 'Poll comments' },
		{ name: 'users', description: 'User profiles' },
	],
});

const outPath = join(__dirname, '..', 'openapi.json');
writeFileSync(outPath, JSON.stringify(document, null, 2) + '\n', 'utf8');
console.log(`✓ openapi.json written to ${outPath}`);
