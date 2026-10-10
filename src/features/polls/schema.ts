import { z } from 'zod';

export const POLL_TITLE_MAX = 200;
export const POLL_DESCRIPTION_MAX = 1000;
export const POLL_OPTION_MAX = 100;
export const POLL_OPTIONS_MIN = 2;
export const POLL_OPTIONS_LIMIT = 10;
export const POLL_TAGS_LIMIT = 5;

const DateTime = z.string().datetime({ offset: true });

/**
 * `author` is the commenter's username. A deleted Comment that still has
 * Replies stays as a placeholder: `deleted`, with no author or text.
 * Replies (`parentId` set) always hang off a top-level Comment.
 */
export const CommentSchema = z.object({
	id: z.string(),
	voteId: z.string().optional(),
	userId: z.string().nullish(),
	author: z.string().nullable(),
	text: z.string().nullable(),
	createdAt: DateTime,
	updatedAt: DateTime.nullish(),
	likeCount: z.number().int().optional(),
	edited: z.boolean().optional(),
	likedByCurrentUser: z.boolean().optional(),
	parentId: z.string().nullish(),
	replyCount: z.number().int().optional(),
	deleted: z.boolean().optional(),
});

/** Counts are withheld (null) until a Poll has Ended; read as undefined. */
export const PollOptionSchema = z.object({
	id: z.string(),
	text: z.string(),
	description: z.string().nullish(),
	displayOrder: z.number().int().optional(),
	createdAt: DateTime.optional(),
	votes: z
		.number()
		.int()
		.nullish()
		.transform((votes) => votes ?? undefined),
});

export const TagDtoSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	description: z.string().nullish(),
	displayOrder: z.number().int().optional(),
	usageCount: z.number().int().optional(),
});

/** Who can see what each person chose, once the Poll has Ended. */
export const VoterVisibilitySchema = z.enum(['nobody', 'owner', 'signed-in']);
export const DEFAULT_VOTER_VISIBILITY: VoterVisibility = 'owner';

/** The API spells the levels in upper case; the UI keeps its own keys. */
const API_VOTER_VISIBILITY = {
	nobody: 'NOBODY',
	owner: 'OWNER',
	'signed-in': 'SIGNED_IN',
} as const satisfies Record<VoterVisibility, string>;

export function toApiVoterVisibility(level: VoterVisibility) {
	return API_VOTER_VISIBILITY[level];
}

const FROM_API_VOTER_VISIBILITY = {
	NOBODY: 'nobody',
	OWNER: 'owner',
	SIGNED_IN: 'signed-in',
} as const satisfies Record<string, VoterVisibility>;

const ApiVoterVisibilitySchema = z
	.enum(['NOBODY', 'OWNER', 'SIGNED_IN'])
	.transform((level) => FROM_API_VOTER_VISIBILITY[level]);

/** One Participant's Ballot, from GET /votes/{id}/voters (Ended Polls only). */
export const VoterSchema = z.object({
	userId: z.string(),
	username: z.string(),
	optionId: z.string(),
	votedAt: DateTime,
});

export const PollResultOptionSchema = z.object({
	id: z.string(),
	text: z.string(),
	voteCount: z.number().int(),
	/** Support: share of Participants, 0–100, not rounded. */
	percentage: z.number().optional(),
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

/** The API's `VoteResponse`. Option counts are null (Sealed) until the Poll Ends. */
export const PollSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullish(),
	active: z.boolean(),
	votingActive: z.boolean(),
	/** @deprecated Replaced by `voterVisibility`. */
	anonymous: z.boolean().optional(),
	voterVisibility: ApiVoterVisibilitySchema.optional(),
	creatorId: z.string(),
	creatorUsername: z.string(),
	createdAt: DateTime,
	updatedAt: DateTime.nullish(),
	startTime: DateTime,
	endTime: DateTime.nullable(),
	totalVotes: z.number().int().optional(),
	participantCount: z.number().int().optional(),
	commentCount: z.number().int().optional(),
	myOptionId: z.string().nullable().optional(),
	/** Ended Notification not yet read; only set on `/votes/my?status=ended`. */
	unread: z.boolean().nullish(),
	options: z.array(PollOptionSchema),
	tags: z.array(TagDtoSchema).nullish(),
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
	options: { text: string }[];
	startTime: string;
	endTime: string;
	voterVisibility: VoterVisibility;
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
