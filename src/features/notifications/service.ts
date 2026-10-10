'use server';

import { z } from 'zod';

import { apiClient, ApiError, AuthError } from '@/lib/api/client';

const UnreadCountSchema = z.object({ count: z.number().int() });

/**
 * Ended Notifications the signed-in user hasn't read; null once the session
 * is gone. The list itself is `getMyPolls('ended')`, where each Poll carries `unread`.
 */
export async function getUnreadCount(): Promise<number | null> {
	try {
		return UnreadCountSchema.parse(await apiClient('/notifications/unread-count')).count;
	} catch (error) {
		if (error instanceof AuthError) return null;
		throw error;
	}
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
