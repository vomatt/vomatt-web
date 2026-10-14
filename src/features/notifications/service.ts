'use server';

import { z } from 'zod';

import { apiClient, ApiError, AuthError } from '@/lib/api/client';

const UnreadCountSchema = z.object({ count: z.number().int() });

/**
 * Unread Invitations (to Scheduled or Open Invite-only Polls) plus unread
 * Ended Notifications; null once the session is gone. Each Poll in
 * `getMyPolls` carries its own `unread`.
 */
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

/**
 * Marks the Poll's current notification read: the Invitation, or the Ended
 * Notification once it has Ended. Idempotent; nothing to read is ignored.
 */
export async function markNotificationRead(pollId: string): Promise<void> {
	try {
		await apiClient(`/notifications/${encodeURIComponent(pollId)}/read`, { method: 'POST' });
	} catch (error) {
		if (error instanceof ApiError && NOTHING_TO_READ.includes(error.data?.errorCode)) return;
		console.error('Marking notification read failed:', error);
	}
}
