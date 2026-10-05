import { z } from 'zod';

export const POLL_TITLE_MAX = 200;
export const POLL_DESCRIPTION_MAX = 1000;
export const POLL_OPTION_MAX = 100;
export const POLL_OPTIONS_MIN = 2;
export const POLL_OPTIONS_LIMIT = 10;
export const POLL_TAGS_LIMIT = 5;

const DateTime = z.string().datetime({ offset: true });

export const CommentSchema = z.object({
	id: z.string(),
	voteId: z.string().optional(),
	userId: z.string().optional(),
	author: z.string(),
	text: z.string(),
	createdAt: DateTime,
	updatedAt: DateTime.optional(),
	likeCount: z.number().int().optional(),
	edited: z.boolean().optional(),
	likedByCurrentUser: z.boolean().optional(),
});

/** Counts are withheld while a Poll is Open, so `votes` is optional. */
export const PollOptionSchema = z.object({
	id: z.string(),
	text: z.string(),
	description: z.string().optional(),
	displayOrder: z.number().int().optional(),
	createdAt: DateTime.optional(),
	votes: z.number().int().optional(),
});

export const TagDtoSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	description: z.string().optional(),
	displayOrder: z.number().int().optional(),
	usageCount: z.number().int().optional(),
});

/** Who can see what each person chose, once the Poll has Ended. */
export const VoterVisibilitySchema = z.enum(['nobody', 'owner', 'signed-in']);
export const DEFAULT_VOTER_VISIBILITY: VoterVisibility = 'owner';

export const VoterSchema = z.object({
	userId: z.string().optional(),
	username: z.string(),
	votedAt: DateTime.optional(),
});

export const PollResultOptionSchema = z.object({
	id: z.string(),
	text: z.string(),
	voteCount: z.number().int(),
	percentage: z.number().optional(),
	voters: z.array(VoterSchema).optional(),
});

/** GET /votes/{id}/results — only available once the Poll has Ended. */
export const PollResultsSchema = z.object({
	id: z.string(),
	totalVotes: z.number().int().optional(),
	totalParticipants: z.number().int().optional(),
	options: z.array(PollResultOptionSchema),
});

export const UserVoteStatusSchema = z.object({
	hasVoted: z.boolean(),
	selectedOptions: z.array(z.string()).optional(),
});

/**
 * Accepts both the current API shape and the sealed-ballot shape: counts,
 * `participantCount`, `myOptionId` and `voterVisibility` are all optional
 * until the backend ships them.
 */
export const PollSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional(),
	active: z.boolean(),
	votingActive: z.boolean(),
	/** @deprecated Replaced by `voterVisibility`. */
	anonymous: z.boolean().optional(),
	voterVisibility: VoterVisibilitySchema.optional(),
	creatorId: z.string(),
	creatorUsername: z.string(),
	createdAt: DateTime,
	updatedAt: DateTime.optional(),
	startTime: DateTime,
	endTime: DateTime.nullable(),
	totalVotes: z.number().int().optional(),
	participantCount: z.number().int().optional(),
	myOptionId: z.string().nullable().optional(),
	options: z.array(PollOptionSchema),
	tags: z.array(TagDtoSchema).optional(),
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

/** Request body for POST /api/v1/votes and PUT /api/v1/votes/{id}. */
export const CreatePollRequestSchema = z.object({
	title: z.string().max(POLL_TITLE_MAX),
	description: z.string().max(POLL_DESCRIPTION_MAX).optional(),
	options: z.array(CreatePollOptionSchema).min(POLL_OPTIONS_MIN),
	startTime: DateTime,
	endTime: DateTime,
	/** Every Poll is single choice; the API rejects `true`. */
	allowMultipleChoices: z.literal(false),
	/** @deprecated Sent as `voterVisibility === 'nobody'` until backend 2 ships. */
	anonymous: z.boolean(),
	voterVisibility: VoterVisibilitySchema,
	tagIds: z.array(z.string().uuid()).max(POLL_TAGS_LIMIT).optional(),
});

export const CreateCommentRequestSchema = z.object({
	text: z.string().min(1).max(2000),
});

export const UpdateCommentRequestSchema = z.object({
	text: z.string().min(1).max(2000),
});

/** What the creator hands to the service. Times are full ISO strings with an offset. */
export interface PollInput {
	title: string;
	description?: string;
	options: { text: string; description?: string }[];
	startTime: string;
	endTime: string;
	voterVisibility: VoterVisibility;
	tagIds?: string[];
}

export type Comment = z.infer<typeof CommentSchema>;
export type PollOption = z.infer<typeof PollOptionSchema>;
export type TagDto = z.infer<typeof TagDtoSchema>;
export type VoterVisibility = z.infer<typeof VoterVisibilitySchema>;
export type Voter = z.infer<typeof VoterSchema>;
export type PollResults = z.infer<typeof PollResultsSchema>;
export type UserVoteStatus = z.infer<typeof UserVoteStatusSchema>;
export type Poll = z.infer<typeof PollSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type Pageable = z.infer<typeof PageableSchema>;
export type PollPage = z.infer<typeof PollPageSchema>;
export type CreatePollOption = z.infer<typeof CreatePollOptionSchema>;
export type CreatePollRequest = z.infer<typeof CreatePollRequestSchema>;
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;
export type UpdateCommentRequest = z.infer<typeof UpdateCommentRequestSchema>;
