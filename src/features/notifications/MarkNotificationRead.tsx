'use client';

import { useEffect, useRef } from 'react';

import { markNotificationRead } from './service';
import { useUnreadCount } from './UnreadCountProvider';

/**
 * Viewing a Poll reads its notification: an Invitation, or the Ended
 * Notification. Waits for the unread count, and skips the request when nothing is unread.
 */
export function MarkNotificationRead({ pollId }: { pollId: string }) {
	const { count, isLoaded, refresh } = useUnreadCount();
	const handledPollId = useRef<string | null>(null);

	useEffect(() => {
		if (!isLoaded || handledPollId.current === pollId) return;
		handledPollId.current = pollId;
		if (count > 0) markNotificationRead(pollId).then(refresh);
	}, [count, isLoaded, pollId, refresh]);

	return null;
}
