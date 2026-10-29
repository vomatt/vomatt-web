'use client';

import { useEffect, useRef } from 'react';

import { markNotificationsRead } from './service';
import { useUnreadCount } from './UnreadCountProvider';

/** Ids queued within this long of each other are read together, with one recount. */
export const READ_BATCH_MS = 2000;
/** The longest an id waits in the queue while more keep arriving. */
export const READ_MAX_WAIT_MS = 5000;

/**
 * Marks notifications read on the server, each id once, and recounts the unread badge after.
 * `read` sends now (the person opened it); `queue` waits for the batch (it was seen), and
 * leaving the page or hiding the tab sends what is queued. Ids the server leaves unread are
 * queued again. `markedAll` drops the queue once everything has been read another way.
 */
export function useMarkRead() {
	const { refresh } = useUnreadCount();
	const sentIds = useRef(new Set<string>());
	const queuedIds = useRef(new Set<string>());
	const batchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const maxWaitTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	// Ids left unread go back in the queue without arming it: the next batch, hiding the tab or leaving takes them
	const requeue = (ids: string[]) => {
		for (const id of ids) {
			sentIds.current.delete(id);
			queuedIds.current.add(id);
		}
	};
	const read = (ids: string[]) => {
		const unsent = ids.filter((id) => !sentIds.current.has(id));
		if (unsent.length === 0) return;
		for (const id of unsent) sentIds.current.add(id);
		markNotificationsRead(unsent).then(
			(result) => {
				requeue(result.ok ? result.data : unsent);
				refresh();
			},
			(error) => {
				console.error('Marking notifications read failed:', error);
				requeue(unsent);
			}
		);
	};
	const takeQueued = () => {
		clearTimeout(batchTimer.current);
		clearTimeout(maxWaitTimer.current);
		maxWaitTimer.current = undefined;
		const ids = [...queuedIds.current];
		queuedIds.current.clear();
		return ids;
	};
	const sendQueued = () => read(takeQueued());
	const queue = (ids: string[]) => {
		for (const id of ids) queuedIds.current.add(id);
		clearTimeout(batchTimer.current);
		batchTimer.current = setTimeout(sendQueued, READ_BATCH_MS);
		maxWaitTimer.current ??= setTimeout(sendQueued, READ_MAX_WAIT_MS);
	};
	const markedAll = () => {
		for (const id of takeQueued()) sentIds.current.add(id);
	};

	useEffect(() => {
		const onHide = () => {
			if (document.visibilityState === 'hidden') sendQueued();
		};
		document.addEventListener('visibilitychange', onHide);
		window.addEventListener('pagehide', sendQueued);
		return () => {
			document.removeEventListener('visibilitychange', onHide);
			window.removeEventListener('pagehide', sendQueued);
			sendQueued();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return { read, queue, markedAll };
}
