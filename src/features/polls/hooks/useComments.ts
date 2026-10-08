'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { mergeById } from '@/lib/api/cursor';

import type { Comment } from '../schema';
import {
	deleteComment,
	getComments,
	likeComment,
	postComment,
	unlikeComment,
	updateComment,
} from '../service';

type Status = 'loading' | 'ready' | 'signed-out' | 'error';

/** Adjusts a known total; an unknown one stays unknown. */
const shiftTotal = (delta: number) => (count: number | undefined) =>
	count === undefined ? count : count + delta;

/**
 * Comments on one Poll, newest first, with optimistic posting and likes.
 * Loads only when `enabled`, so collapsed feed cards don't fetch.
 */
export function useComments(pollId: string, { enabled }: { enabled: boolean }) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [total, setTotal] = useState<number | undefined>(undefined);
	const [status, setStatus] = useState<Status>('loading');
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	// Collapsing and reopening a card keeps the comments already loaded
	const hasLoaded = useRef(false);

	const applyFirstPage = useCallback((result: Awaited<ReturnType<typeof getComments>>) => {
		if (!result.ok) {
			setStatus(result.status === 401 ? 'signed-out' : 'error');
			return;
		}
		hasLoaded.current = true;
		setComments(result.data.items);
		setNextCursor(result.data.nextCursor);
		setTotal(result.data.total);
		setStatus('ready');
	}, []);

	const reload = useCallback(async () => {
		setStatus('loading');
		applyFirstPage(await getComments(pollId));
	}, [applyFirstPage, pollId]);

	useEffect(() => {
		if (!enabled || hasLoaded.current) return;
		let ignore = false;
		getComments(pollId).then((result) => {
			if (!ignore) applyFirstPage(result);
		});
		return () => {
			ignore = true;
		};
	}, [applyFirstPage, enabled, pollId]);

	const loadMore = useCallback(async () => {
		if (!nextCursor || isLoadingMore) return;
		setIsLoadingMore(true);
		const result = await getComments(pollId, nextCursor);
		setIsLoadingMore(false);
		if (!result.ok) return;
		setComments((prev) => mergeById(prev, result.data.items));
		setNextCursor(result.data.nextCursor);
	}, [isLoadingMore, nextCursor, pollId]);

	/** Shows the comment at once as `pending`, then swaps in the saved one. */
	const add = useCallback(
		async (text: string, author: string) => {
			const tempId = `pending-${Date.now()}`;
			const pending: Comment = { id: tempId, author, text, createdAt: new Date().toISOString() };
			setComments((prev) => [pending, ...prev]);
			setTotal(shiftTotal(1));

			const result = await postComment(pollId, text);
			if (result.ok) {
				setComments((prev) => prev.map((c) => (c.id === tempId ? result.data : c)));
				return true;
			}
			setComments((prev) => prev.filter((c) => c.id !== tempId));
			setTotal(shiftTotal(-1));
			return false;
		},
		[pollId]
	);

	const edit = useCallback(
		async (commentId: string, text: string) => {
			const result = await updateComment(pollId, commentId, text);
			if (!result.ok) return false;
			setComments((prev) => prev.map((c) => (c.id === commentId ? result.data : c)));
			return true;
		},
		[pollId]
	);

	const remove = useCallback(
		async (commentId: string) => {
			const result = await deleteComment(pollId, commentId);
			if (!result.ok) return false;
			setComments((prev) => prev.filter((c) => c.id !== commentId));
			setTotal(shiftTotal(-1));
			return true;
		},
		[pollId]
	);

	const toggleLike = useCallback(
		async (comment: Comment) => {
			const liked = !comment.likedByCurrentUser;
			const apply = (isLiked: boolean) =>
				setComments((prev) =>
					prev.map((c) =>
						c.id === comment.id
							? {
									...c,
									likedByCurrentUser: isLiked,
									likeCount: Math.max(0, (c.likeCount ?? 0) + (isLiked ? 1 : -1)),
								}
							: c
					)
				);
			apply(liked);
			const result = await (liked ? likeComment : unlikeComment)(pollId, comment.id);
			if (!result.ok) apply(!liked);
		},
		[pollId]
	);

	return {
		comments,
		total,
		status,
		hasMore: !!nextCursor,
		isLoadingMore,
		reload,
		loadMore,
		add,
		edit,
		remove,
		toggleLike,
	};
}

export type CommentsState = ReturnType<typeof useComments>;
