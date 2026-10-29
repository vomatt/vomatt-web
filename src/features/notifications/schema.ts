import { z } from 'zod';

import { FollowUserDtoSchema } from '@/features/follows/schema';

/**
 * The Poll a notification is about. No per-option counts, so it reads the same sealed or not;
 * the outcome (`winningOptionIds`, `winningOptionLabels`, `tie`) is null until the Poll has Ended.
 */
const PollSummarySchema = z.object({
	id: z.string(),
	title: z.string(),
	startTime: z.string(),
	endTime: z.string().nullish(),
	status: z.enum(['SCHEDULED', 'OPEN', 'ENDED']),
	turnout: z.number().int().nullish(),
	myOptionId: z.string().nullish(),
	winningOptionIds: z.array(z.string()).nullish(),
	winningOptionLabels: z.array(z.string()).nullish(),
	tie: z.boolean().nullish(),
});

export type PollSummary = z.infer<typeof PollSummarySchema>;

const base = { id: z.string(), createdAt: z.string(), read: z.boolean() };

/** One item of `GET /notifications`; which of `actor`, `poll` and `comment` it carries follows its `kind`. */
export const NotificationSchema = z.discriminatedUnion('kind', [
	z.object({ ...base, kind: z.literal('RESULT'), poll: PollSummarySchema }),
	z.object({ ...base, kind: z.literal('CANCELLED'), actor: FollowUserDtoSchema, poll: PollSummarySchema }),
	z.object({ ...base, kind: z.literal('INVITATION'), actor: FollowUserDtoSchema, poll: PollSummarySchema }),
	z.object({ ...base, kind: z.literal('FOLLOWED'), actor: FollowUserDtoSchema }),
	z.object({
		...base,
		kind: z.literal('COMMENT'),
		actor: FollowUserDtoSchema,
		poll: PollSummarySchema,
		comment: z.object({ id: z.string(), parentId: z.string().nullish(), excerpt: z.string() }),
	}),
	z.object({
		...base,
		kind: z.literal('MENTION'),
		actor: FollowUserDtoSchema,
		poll: PollSummarySchema,
		comment: z.object({ id: z.string(), parentId: z.string().nullish(), excerpt: z.string() }),
	}),
	z.object({ ...base, kind: z.literal('CLOSING_SOON'), actor: FollowUserDtoSchema, poll: PollSummarySchema }),
]);

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationKind = Notification['kind'];

export const NotificationPreferencesSchema = z.object({
	resultsIn: z.boolean(),
	invitations: z.boolean(),
	comments: z.boolean(),
	mentions: z.boolean(),
	closingSoon: z.boolean(),
});

/** Which kinds the feed and the unread count include; `resultsIn` covers RESULT and CANCELLED, FOLLOWED has no switch. */
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
