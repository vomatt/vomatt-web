'use server';

import { z } from 'zod';

import { NOTIFICATIONS_PAGE_SIZE } from '@/features/polls/constants';
import { type ActionResult, attempt } from '@/lib/api/action';
import { apiClient, ApiError, AuthError } from '@/lib/api/client';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';

import {
	type Notification,
	type NotificationCategory,
	type NotificationPreferences,
	NotificationPreferencesSchema,
	NotificationSchema,
} from './schema';

const UnreadCountSchema = z.object({ count: z.number().int() });

/** Unread notifications of every kind the user's preferences leave on (one category's with `category`); null once the session is gone. */
export async function getUnreadCount(category?: NotificationCategory): Promise<number | null> {
	try {
		const query = category ? `?${new URLSearchParams({ category })}` : '';
		return UnreadCountSchema.parse(await apiClient(`/notifications/unread-count${query}`)).count;
	} catch (error) {
		if (error instanceof AuthError) return null;
		throw error;
	}
}

const UnreadIdsSchema = z.object({ ids: z.array(z.string()) });

/** Ids of the feed's unread notifications (newest first, at most 100; one category's with `category`). Fetch before read-all to know what was unread. */
export async function getUnreadNotificationIds(category?: NotificationCategory): Promise<string[]> {
	const query = category ? `?${new URLSearchParams({ category })}` : '';
	return UnreadIdsSchema.parse(await apiClient(`/notifications/unread-ids${query}`)).ids;
}

const KINDS = new Set<string>(NotificationSchema.options.map((option) => option.shape.kind.value));
const RawPage = cursorPageSchema(z.object({ kind: z.string() }).passthrough());

/**
 * The feed, newest first; each item carries all its row shows. With `category`, only that tab's
 * items; pass the same one with every page.
 * A kind this client doesn't know yet, or an item that doesn't fit its kind, is left out rather than failing the page.
 */
export async function getNotifications(
	cursor?: string | null,
	category?: NotificationCategory
): Promise<CursorPage<Notification>> {
	const params = pageParams(cursor, NOTIFICATIONS_PAGE_SIZE);
	if (category) params.set('category', category);
	const page = RawPage.parse(await apiClient(`/notifications?${params}`));
	const items = page.items.flatMap((item) => {
		if (!KINDS.has(item.kind)) return [];
		const parsed = NotificationSchema.safeParse(item);
		if (!parsed.success) console.error('Skipping a malformed notification:', parsed.error);
		return parsed.success ? [parsed.data] : [];
	});
	return { items, nextCursor: page.nextCursor };
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

/** Marks read every notification created up to now, of every kind; the unread count becomes 0. Idempotent. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient('/notifications/read-all', { method: 'POST' });
	});
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
	return NotificationPreferencesSchema.parse(await apiClient('/users/me/notification-preferences'));
}

/** Sets the switches sent and returns all of them. */
export async function updateNotificationPreferences(
	change: Partial<NotificationPreferences>
): Promise<ActionResult<NotificationPreferences>> {
	return attempt(async () =>
		NotificationPreferencesSchema.parse(
			await apiClient('/users/me/notification-preferences', { method: 'PATCH', body: JSON.stringify(change) })
		)
	);
}
