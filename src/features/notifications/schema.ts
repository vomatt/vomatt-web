import { z } from 'zod';

import type { Poll } from '@/features/polls/schema';
import { UserDtoSchema } from '@/schemas/user';

/** The Poll a notification is about: no per-option counts, so it reads the same sealed or not. */
const PollSummarySchema = z.object({
	id: z.string(),
	title: z.string(),
	endTime: z.string().nullish(),
	status: z.enum(['SCHEDULED', 'OPEN', 'ENDED']),
	turnout: z.number().int().nullish(),
});

const base = { id: z.string(), createdAt: z.string(), read: z.boolean() };

/** One item of `GET /notifications`; which of `actor`, `poll` and `comment` it carries follows its `kind`. */
export const NotificationSchema = z.discriminatedUnion('kind', [
	z.object({ ...base, kind: z.literal('RESULT'), poll: PollSummarySchema }),
	z.object({ ...base, kind: z.literal('CANCELLED'), actor: UserDtoSchema, poll: PollSummarySchema }),
	z.object({ ...base, kind: z.literal('INVITATION'), actor: UserDtoSchema, poll: PollSummarySchema }),
	z.object({ ...base, kind: z.literal('FOLLOWED'), actor: UserDtoSchema }),
	z.object({
		...base,
		kind: z.literal('COMMENT'),
		actor: UserDtoSchema,
		poll: PollSummarySchema,
		comment: z.object({ id: z.string(), excerpt: z.string() }),
	}),
	z.object({ ...base, kind: z.literal('CLOSING_SOON'), actor: UserDtoSchema, poll: PollSummarySchema }),
]);

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationKind = Notification['kind'];
type OfKind<K extends NotificationKind> = Extract<Notification, { kind: K }>;

/**
 * A notification with what its row needs beyond the feed: the full Poll for a result or an
 * invitation (its outcome, the viewer's Ballot, when it opens), null when it couldn't be read;
 * the viewer's relation to a new follower, whose `isFollowing` is null when it couldn't be read.
 */
export type FeedItem =
	| OfKind<'CANCELLED' | 'COMMENT' | 'CLOSING_SOON'>
	| (OfKind<'RESULT' | 'INVITATION'> & { detail: Poll | null })
	| (OfKind<'FOLLOWED'> & { relation: { isFollowing: boolean | null; followsYou: true } });

export const NotificationPreferencesSchema = z.object({
	resultsIn: z.boolean(),
	invitations: z.boolean(),
	comments: z.boolean(),
	closingSoon: z.boolean(),
});

/** Which kinds the feed and the unread count include; `resultsIn` covers RESULT and CANCELLED, FOLLOWED has no switch. */
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
