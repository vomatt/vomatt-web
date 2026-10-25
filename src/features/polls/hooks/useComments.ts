'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { mergeById } from '@/lib/api/cursor';

import type { Comment } from '../schema';
import {
	deleteComment,
	getComments,
	getReplies,
	likeComment,
	postComment,
	unlikeComment,
	updateComment,
} from '../service';
import { shiftCount } from '../status';

type Status = 'loading' | 'ready' | 'error';

/** The loaded Replies of one top-level Comment, oldest first. */
export type ReplyList = {
	items: Comment[];
	nextCursor: string | null;
	status: 'loading' | 'ready' | 'error';
};

const NO_REPLIES: ReplyList = { items: [], nextCursor: null, status: 'ready' };

/** A deleted Comment that still has Replies stays as a placeholder. */
function toPlaceholder(comment: Comment): Comment {
	return { ...comment, deleted: true, author: null, text: null, userId: null };
}

/**
 * Comments on one Poll, newest first, with one level of Replies loaded on
 * demand, optimistic posting and likes. Loads only when `enabled`, so
 * collapsed feed cards don't fetch. `initialTotal` is the Poll's
 * `commentCount` (Comments and Replies that aren't deleted).
 */
export function useComments(
	pollId: string,
	{ enabled, initialTotal }: { enabled: boolean; initialTotal?: number }
) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [replies, setReplies] = useState<Record<string, ReplyList>>({});
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [total, setTotal] = useState(initialTotal);
	const [status, setStatus] = useState<Status>('loading');
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	// Collapsing and reopening a card keeps the comments already loaded
	const hasLoaded = useRef(false);

	const applyFirstPage = useCallback((result: Awaited<ReturnType<typeof getComments>>) => {
		if (!result.ok) {
			setStatus('error');
			return;
		}
		hasLoaded.current = true;
		setComments(result.data.items);
		setReplies({});
		setNextCursor(result.data.nextCursor);
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

	/** First call loads the Replies; later calls load the next page. */
	const loadReplies = useCallback(
		async (rootId: string) => {
			const current = replies[rootId];
			if (current?.status === 'loading') return;
			// Loaded to the end; a failed page is retried from where it stopped
			if (current && current.status !== 'error' && !current.nextCursor) return;
			const setList = (change: (list: ReplyList) => ReplyList) =>
				setReplies((prev) => ({ ...prev, [rootId]: change(prev[rootId] ?? NO_REPLIES) }));
			setList((list) => ({ ...list, status: 'loading' }));
			const result = await getReplies(pollId, rootId, current?.nextCursor);
			setList((list) =>
				result.ok
					? { items: mergeById(list.items, result.data.items), nextCursor: result.data.nextCursor, status: 'ready' }
					: { ...list, status: 'error' }
			);
		},
		[pollId, replies]
	);

	/** Applies `change` to the Comment or Reply with this id, wherever it is. */
	const updateOne = useCallback((id: string, change: (comment: Comment) => Comment) => {
		const apply = (list: Comment[]) => list.map((c) => (c.id === id ? change(c) : c));
		setComments(apply);
		setReplies((prev) =>
			Object.fromEntries(
				Object.entries(prev).map(([rootId, list]) => [rootId, { ...list, items: apply(list.items) }])
			)
		);
	}, []);

	const shiftReplyCount = useCallback(
		(rootId: string, by: number) =>
			updateOne(rootId, (c) => ({ ...c, replyCount: Math.max(0, (c.replyCount ?? 0) + by) })),
		[updateOne]
	);

	/**
	 * Shows the Comment at once as `pending`, then swaps in the saved one.
	 * With `rootId` it is a Reply under that top-level Comment.
	 */
	const add = useCallback(
		async (text: string, author: string, rootId?: string) => {
			const tempId = `pending-${Date.now()}`;
			const pending: Comment = {
				id: tempId,
				author,
				text,
				createdAt: new Date().toISOString(),
				parentId: rootId ?? null,
			};
			// The list the new Comment goes into: its thread's Replies, or the top level
			const setList = (change: (list: Comment[]) => Comment[]) =>
				rootId
					? setReplies((prev) => {
							const list = prev[rootId] ?? NO_REPLIES;
							return { ...prev, [rootId]: { ...list, items: change(list.items) } };
						})
					: setComments(change);

			// Replies read oldest first, top-level Comments newest first
			setList((list) => (rootId ? [...list, pending] : [pending, ...list]));
			if (rootId) shiftReplyCount(rootId, 1);
			setTotal((count) => shiftCount(count, 1));

			const result = await postComment(pollId, text, rootId);
			setList((list) =>
				result.ok
					? list.map((c) => (c.id === tempId ? result.data : c))
					: list.filter((c) => c.id !== tempId)
			);
			if (result.ok) return true;

			if (rootId) shiftReplyCount(rootId, -1);
			setTotal((count) => shiftCount(count, -1));
			return false;
		},
		[pollId, shiftReplyCount]
	);

	const edit = useCallback(
		async (commentId: string, text: string) => {
			const result = await updateComment(pollId, commentId, text);
			if (!result.ok) return false;
			updateOne(commentId, () => result.data);
			return true;
		},
		[pollId, updateOne]
	);

	/**
	 * A top-level Comment with Replies becomes a placeholder; anything else
	 * leaves the list. A placeholder whose last Reply goes leaves too.
	 */
	const remove = useCallback(
		async (comment: Comment) => {
			const result = await deleteComment(pollId, comment.id);
			if (!result.ok) return false;
			setTotal((count) => shiftCount(count, -1));

			const rootId = comment.parentId;
			if (!rootId) {
				setComments((prev) =>
					(comment.replyCount ?? 0) > 0
						? prev.map((c) => (c.id === comment.id ? toPlaceholder(c) : c))
						: prev.filter((c) => c.id !== comment.id)
				);
				return true;
			}
			setReplies((prev) => {
				const list = prev[rootId];
				return list ? { ...prev, [rootId]: { ...list, items: list.items.filter((c) => c.id !== comment.id) } } : prev;
			});
			shiftReplyCount(rootId, -1);
			// A placeholder with no Replies left isn't listed by the API either
			setComments((prev) => prev.filter((c) => !(c.id === rootId && c.deleted && !c.replyCount)));
			return true;
		},
		[pollId, shiftReplyCount]
	);

	/**
	 * After a block: the API leaves out the threads that user started and the Replies they wrote,
	 * and stops counting those Replies, so the loaded list does the same without a refetch.
	 */
	const dropAuthor = useCallback(
		(author: string) => {
			const dropped: Record<string, number> = {};
			for (const [rootId, list] of Object.entries(replies)) {
				dropped[rootId] = list.items.filter((c) => c.author === author).length;
			}
			setReplies((prev) =>
				Object.fromEntries(
					Object.entries(prev).map(([rootId, list]) => [
						rootId,
						{ ...list, items: list.items.filter((c) => c.author !== author) },
					])
				)
			);
			setComments((prev) =>
				prev
					.filter((c) => c.author !== author)
					.map((c) => (dropped[c.id] ? { ...c, replyCount: Math.max(0, (c.replyCount ?? 0) - dropped[c.id]) } : c))
					// A placeholder with no Replies left isn't listed by the API either
					.filter((c) => !(c.deleted && !c.replyCount))
			);
		},
		[replies]
	);

	const toggleLike = useCallback(
		async (comment: Comment) => {
			const liked = !comment.likedByCurrentUser;
			const apply = (isLiked: boolean) =>
				updateOne(comment.id, (c) => ({
					...c,
					likedByCurrentUser: isLiked,
					likeCount: Math.max(0, (c.likeCount ?? 0) + (isLiked ? 1 : -1)),
				}));
			apply(liked);
			const result = await (liked ? likeComment : unlikeComment)(pollId, comment.id);
			if (!result.ok) apply(!liked);
		},
		[pollId, updateOne]
	);

	return {
		comments,
		replies,
		total,
		status,
		hasMore: !!nextCursor,
		isLoadingMore,
		reload,
		loadMore,
		loadReplies,
		add,
		edit,
		remove,
		dropAuthor,
		toggleLike,
	};
}

export type CommentsState = ReturnType<typeof useComments>;
