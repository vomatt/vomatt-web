'use server';

import { z } from 'zod';

import type { ActionResult } from '@/lib/api/action';
import { attempt } from '@/lib/api/action';
import { apiClient, ApiError, AuthError } from '@/lib/api/client';
import { type CursorPage, cursorPageSchema, pageParams } from '@/lib/api/cursor';

import {
	type Notification,
	type NotificationPreferences,
	NotificationPreferencesSchema,
	NotificationSchema,
} from './schema';

const UnreadCountSchema = z.object({ count: z.number().int() });

/** Unread items of the feed, of the kinds switched on; null once the session is gone. */
export async function getUnreadCount(): Promise<number | null> {
	try {
		return UnreadCountSchema.parse(await apiClient('/notifications/unread-count')).count;
	} catch (error) {
		if (error instanceof AuthError) return null;
		throw error;
	}
}

/** No notification for this user, or the Poll is gone (Deleted). */
const NOTHING_TO_READ = ['notification.not_found', 'vote.not_found'];

/** Reads one notification; false when the request failed (nothing to read counts as done). */
async function readNotification(id: string): Promise<boolean> {
	try {
		await apiClient(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
		return true;
	} catch (error) {
		if (error instanceof ApiError && NOTHING_TO_READ.includes(error.data?.errorCode)) return true;
		console.error('Marking notification read failed:', error);
		return false;
	}
}

/**
 * Marks a notification read by its feed `id`, or by a Poll id (deprecated, but it is how
 * viewing a Poll reads its Invitation or Result). Idempotent; nothing to read counts as done. False when the request failed.
 */
export async function markNotificationRead(id: string): Promise<boolean> {
	return readNotification(id);
}

const NotificationPage = cursorPageSchema(NotificationSchema);

/** The caller's notifications, newest first. Derived when read, so an item can vanish between pages. */
export async function getNotifications(cursor?: string | null): Promise<ActionResult<CursorPage<Notification>>> {
	return attempt(async () => NotificationPage.parse(await apiClient(`/notifications?${pageParams(cursor, 20)}`)));
}

/** Reads everything up to now; later notifications arrive unread. */
export async function markAllNotificationsRead(): Promise<ActionResult> {
	return attempt(async () => {
		await apiClient('/notifications/read-all', { method: 'POST' });
	});
}

export async function getNotificationPreferences(): Promise<ActionResult<NotificationPreferences>> {
	return attempt(async () => NotificationPreferencesSchema.parse(await apiClient('/users/me/notification-preferences')));
}

/** Sets the switches sent and returns all four. */
export async function updateNotificationPreferences(
	changes: Partial<NotificationPreferences>
): Promise<ActionResult<NotificationPreferences>> {
	return attempt(async () =>
		NotificationPreferencesSchema.parse(
			await apiClient('/users/me/notification-preferences', { method: 'PATCH', body: JSON.stringify(changes) })
		)
	);
}
