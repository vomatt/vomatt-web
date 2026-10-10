'use client';

import { useEffect } from 'react';

import { markNotificationRead } from './service';
import { useUnreadCount } from './UnreadCountProvider';

/** Viewing an Ended Poll reads its notification (owners and Participants only). */
export function MarkNotificationRead({ pollId }: { pollId: string }) {
	const { refresh } = useUnreadCount();
	useEffect(() => {
		markNotificationRead(pollId).then(refresh);
	}, [pollId, refresh]);
	return null;
}
