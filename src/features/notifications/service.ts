'use server';

import { z } from 'zod';

import { NOTIFICATIONS_PAGE_SIZE } from '@/features/polls/constants';
import { getPoll } from '@/features/polls/service';
import { type ActionResult, attempt } from '@/lib/api/action';
import { apiClient, ApiError, AuthError } from '@/lib/api/client';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';
import { getUserProfile } from '@/lib/api/services/users';

import {
	type FeedItem,
	type Notification,
	type NotificationPreferences,
	NotificationPreferencesSchema,
	NotificationSchema,
} from './schema';

const UnreadCountSchema = z.object({ count: z.number().int() });

/** Unread notifications of every kind the user's preferences leave on; null once the session is gone. */
export async function getUnreadCount(): Promise<number | null> {
	try {
		return UnreadCountSchema.parse(await apiClient('/notifications/unread-count')).count;
	} catch (error) {
		if (error instanceof AuthError) return null;
		throw error;
	}
}

const KINDS = new Set<string>(NotificationSchema.options.map((option) => option.shape.kind.value));
const RawPage = cursorPageSchema(z.object({ kind: z.string() }).passthrough());

/** Logs a lookup a row can do without, so the row falls back to what the feed says. */
const orNull = <T>(request: Promise<T>, what: string) =>
	request.catch((error) => {
		console.error(`Reading ${what} for a notification failed:`, error);
		return null;
	});

async function withDetail(item: Notification): Promise<FeedItem> {
	switch (item.kind) {
		case 'RESULT':
		case 'INVITATION':
			return { ...item, detail: await orNull(getPoll(item.poll.id), 'the poll') };
		case 'FOLLOWED': {
			const profile = await orNull(getUserProfile(item.actor.username), 'the follower');
			return { ...item, relation: { isFollowing: profile?.isFollowing ?? null, followsYou: true } };
		}
		default:
			return item;
	}
}

/**
 * The feed, newest first, with what each row needs beyond it (see `FeedItem`).
 * A kind this client doesn't know yet is left out rather than failing the page.
 */
export async function getNotifications(cursor?: string | null): Promise<CursorPage<FeedItem>> {
	const page = RawPage.parse(await apiClient(`/notifications?${pageParams(cursor, NOTIFICATIONS_PAGE_SIZE)}`));
	const items = page.items.filter((item) => KINDS.has(item.kind)).map((item) => NotificationSchema.parse(item));
	return { items: await Promise.all(items.map(withDetail)), nextCursor: page.nextCursor };
}

/** The notification is gone (Comment deleted, follow undone), or the deprecated Poll id names a Deleted Poll. */
const NOTHING_TO_READ = ['notification.not_found', 'vote.not_found'];

/**
 * Marks one notification read: a feed item's `id`, or (deprecated, for a Poll page) a Poll id,
 * which reads its Invitation before it Ends and its result after. Idempotent; false when the
 * request failed (nothing to read counts as done).
 */
export async function markNotificationRead(id: string): Promise<boolean> {
	try {
		await apiClient(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
		return true;
	} catch (error) {
		if (error instanceof ApiError && NOTHING_TO_READ.includes(error.data?.errorCode)) return true;
		console.error('Marking notification read failed:', error);
		return false;
	}
}

/** Reads everything up to now, every kind; later notifications arrive unread. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient('/notifications/read-all', { method: 'POST' });
	});
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
	return NotificationPreferencesSchema.parse(await apiClient('/users/me/notification-preferences'));
}

/** Sets the switches sent and returns all four. */
export async function updateNotificationPreferences(
	change: Partial<NotificationPreferences>
): Promise<ActionResult<NotificationPreferences>> {
	return attempt(async () =>
		NotificationPreferencesSchema.parse(
			await apiClient('/users/me/notification-preferences', { method: 'PATCH', body: JSON.stringify(change) })
		)
	);
}
