import { z } from 'zod';

export const CommentSchema = z.object({
	id: z.string(),
	voteId: z.string().optional(),
	userId: z.string().optional(),
	author: z.string(),
	text: z.string(),
	createdAt: z.string().datetime({ offset: true }),
	updatedAt: z.string().datetime({ offset: true }).optional(),
	likeCount: z.number().int().optional(),
	edited: z.boolean().optional(),
	likedByCurrentUser: z.boolean().optional(),
});

export const PollOptionSchema = z.object({
	id: z.string(),
	text: z.string(),
	description: z.string().optional(),
	displayOrder: z.number().int().optional(),
	createdAt: z.string().datetime({ offset: true }).optional(),
	votes: z.number().int(),
});

export const PollPrivacyModeSchema = z.enum(['public', 'link-only', 'invite-only']);

export const VoteResultSchema = z.object({
	optionId: z.string(),
	optionText: z.string(),
	voteCount: z.number().int(),
	percentage: z.number(),
});

export const UserVoteStatusSchema = z.object({
	hasVoted: z.boolean(),
	selectedOptionIds: z.array(z.string()).optional(),
});

export const PollSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	active: z.boolean(),
	votingActive: z.boolean(),
	allowMultipleChoices: z.boolean(),
	anonymous: z.boolean(),
	creatorId: z.string(),
	creatorUsername: z.string(),
	createdAt: z.string().datetime({ offset: true }),
	updatedAt: z.string().datetime({ offset: true }),
	startTime: z.string().datetime({ offset: true }),
	endTime: z.string().datetime({ offset: true }).nullable(),
	totalVotes: z.number().int(),
	options: z.array(PollOptionSchema),
	privacyMode: PollPrivacyModeSchema.optional(),
});

export const SortSchema = z.object({
	empty: z.boolean(),
	sorted: z.boolean(),
	unsorted: z.boolean(),
});

export const PageableSchema = z.object({
	pageNumber: z.number().int(),
	pageSize: z.number().int(),
	offset: z.number().int(),
	paged: z.boolean(),
	unpaged: z.boolean(),
	sort: SortSchema,
});

export const PollPageSchema = z.object({
	content: z.array(PollSchema),
	empty: z.boolean(),
	first: z.boolean(),
	last: z.boolean(),
	number: z.number().int(),
	numberOfElements: z.number().int(),
	size: z.number().int(),
	totalElements: z.number().int(),
	totalPages: z.number().int(),
	pageable: PageableSchema,
	sort: SortSchema,
});

export const CreatePollOptionSchema = z.object({
	text: z.string().max(200),
	description: z.string().max(500).default(''),
	displayOrder: z.number().int().default(0),
});

/**
 * Request body for POST /api/v1/votes.
 * Note: the frontend `question` field is renamed to `title` before
 * forwarding to the backend (see src/app/api/create-poll/route.ts).
 */
export const CreatePollRequestSchema = z.object({
	title: z.string(),
	description: z.string().optional(),
	options: z.array(CreatePollOptionSchema).min(2),
	startTime: z.string().datetime({ offset: true }),
	endTime: z.string().datetime({ offset: true }).nullable().optional(),
	allowMultipleChoices: z.boolean(),
	anonymous: z.boolean(),
	privacyMode: PollPrivacyModeSchema,
	invitedUsers: z.array(z.string()).optional(),
});

export const CreateCommentRequestSchema = z.object({
	text: z.string().min(1).max(2000),
});

export const UpdateCommentRequestSchema = z.object({
	text: z.string().min(1).max(2000),
});

export type Comment = z.infer<typeof CommentSchema>;
export type PollOption = z.infer<typeof PollOptionSchema>;
export type PollPrivacyMode = z.infer<typeof PollPrivacyModeSchema>;
export type VoteResult = z.infer<typeof VoteResultSchema>;
export type UserVoteStatus = z.infer<typeof UserVoteStatusSchema>;
export type Poll = z.infer<typeof PollSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type Pageable = z.infer<typeof PageableSchema>;
export type PollPage = z.infer<typeof PollPageSchema>;
export type CreatePollOption = z.infer<typeof CreatePollOptionSchema>;
export type CreatePollRequest = z.infer<typeof CreatePollRequestSchema>;
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;
export type UpdateCommentRequest = z.infer<typeof UpdateCommentRequestSchema>;
