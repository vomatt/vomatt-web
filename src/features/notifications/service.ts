'use server';

import { z } from 'zod';

import { apiClient, ApiError } from '@/lib/api/client';

const UnreadCountSchema = z.object({ count: z.number().int() });

/**
 * Ended Notifications the signed-in user hasn't read. The list itself is
 * `getMyPolls('ended')`, where each Poll carries `unread`.
 */
export async function getUnreadCount(): Promise<number> {
	return UnreadCountSchema.parse(await apiClient('/notifications/unread-count')).count;
}

/**
 * Marks one Poll's Ended Notification read. Idempotent; a Poll that has no
 * notification for this user (404 `notification.not_found`) is ignored.
 */
export async function markNotificationRead(pollId: string): Promise<void> {
	try {
		await apiClient(`/notifications/${encodeURIComponent(pollId)}/read`, { method: 'POST' });
	} catch (error) {
		if (error instanceof ApiError && error.data?.errorCode === 'notification.not_found') return;
		console.error('Marking notification read failed:', error);
	}
}
