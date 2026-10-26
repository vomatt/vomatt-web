import { z } from 'zod';

import { FollowUserDtoSchema } from '@/schemas/user';

export const NOTIFICATION_KINDS = ['RESULT', 'CANCELLED', 'INVITATION', 'FOLLOWED', 'COMMENT', 'CLOSING_SOON'] as const;

/**
 * What a row needs of a Poll, never per-option counts. The outcome fields
 * (`winning*`, `tie`) are null until the Poll has Ended; `myOptionId` is null
 * without a Ballot, or once an Anonymous Ballot of an Ended Poll is sealed.
 */
export const NotificationPollSchema = z.object({
	id: z.string(),
	title: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	status: z.enum(['SCHEDULED', 'OPEN', 'ENDED']),
	turnout: z.number().int(),
	myOptionId: z.string().nullish(),
	winningOptionIds: z.array(z.string()).nullish(),
	winningOptionLabels: z.array(z.string()).nullish(),
	tie: z.boolean().nullish(),
});

/** `parentId` is the Comment a Reply is under; null for a top-level Comment. */
export const NotificationCommentSchema = z.object({
	id: z.string(),
	parentId: z.string().nullish(),
	excerpt: z.string(),
});

/**
 * One item of the feed. `actor` is null for `RESULT`, `poll` for `FOLLOWED`,
 * `comment` for everything but `COMMENT`.
 */
export const NotificationSchema = z.object({
	id: z.string(),
	kind: z.enum(NOTIFICATION_KINDS),
	createdAt: z.string(),
	read: z.boolean(),
	actor: FollowUserDtoSchema.nullish(),
	poll: NotificationPollSchema.nullish(),
	comment: NotificationCommentSchema.nullish(),
});

/** Which kinds are switched on. `resultsIn` covers `RESULT` and `CANCELLED`; `FOLLOWED` has no switch. */
export const NotificationPreferencesSchema = z.object({
	resultsIn: z.boolean(),
	invitations: z.boolean(),
	comments: z.boolean(),
	closingSoon: z.boolean(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationPoll = z.infer<typeof NotificationPollSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
