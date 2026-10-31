'use client';

import { Menu } from '@base-ui/react/menu';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { menuItemClassName, menuPopupClassName } from '@/components/ui/menu';
import { Skeleton } from '@/components/ui/Skeleton';
import { Ban, Copy, Ellipsis, Heart, Link2, Pencil, Reply, Trash2, TriangleAlert, X } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { ENTER, Unfold } from '@/components/Unfold';
import { useLanguage } from '@/contexts/LanguageContext';
import { AccountAvatar } from '@/features/avatars/AccountAvatar';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { BlockUserDialog } from '@/features/blocks/BlockUserDialog';
import { ProfileAvatar, ProfileName } from '@/features/profiles/UserChip';
import { useHydrated } from '@/hooks/useHydrated';
import { commentHash, profileHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import { chipClassName } from '../chip';
import { formatFromNow } from '../format';
import type { CommentsState } from '../hooks/useComments';
import type { Comment } from '../schema';
import { CreateCommentRequestSchema } from '../schema';
import { pollUrl } from '../url';
import { MentionTextarea } from './MentionTextarea';
import { ReportCommentDialog } from './ReportCommentDialog';

const COMMENT_MAX = CreateCommentRequestSchema.shape.text.maxLength ?? 2000;
// The counter shows once the text is this close to its limit
const COUNTER_WITHIN = 200;

/** A Reply to a reply is saved as `@name text`, so the mention takes from the text's limit. */
function textMax(addressee: string | null) {
	return COMMENT_MAX - (addressee ? `@${addressee} `.length : 0);
}

// Like and Reply are 32px pills (36px on phones); the ::before extends the hit area to 44px
const pillClassName =
	"relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-caption-3 font-medium text-muted-foreground transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring md:h-8";

/** The signed-in viewer, whose avatar sits beside the composers. */
type Viewer = { username: string; avatarUrl: string | null };

/** Guests get the plain account icon. */
function ViewerAvatar({ viewer, className }: { viewer?: Viewer; className: string }) {
	return viewer ? (
		<UserAvatar username={viewer.username} avatarUrl={viewer.avatarUrl} className={cn('shrink-0', className)} />
	) : (
		<AccountAvatar className={cn('shrink-0', className)} />
	);
}

/** The 2px line that runs down the avatar rail, and the elbow a reply branches off it with. */
function Elbow({ continues }: { continues: boolean }) {
	return (
		<div aria-hidden className="relative w-8 shrink-0 self-stretch">
			{continues && <div className="absolute top-0 left-[15px] h-full w-0.5 bg-border" />}
			<div className="absolute -top-0.5 left-[15px] h-[18px] w-7 rounded-bl-xl border-b-2 border-l-2 border-border" />
		</div>
	);
}

/** A reply to a reply opens with `@name `; the chip shows who it answers and the text loses the mention. */
function splitAddressee(text: string) {
	const match = /^@([\w.-]+)\s+/.exec(text);
	return match ? { addressee: match[1], text: text.slice(match[0].length) } : { addressee: null, text };
}

// The API's mention rule: a username not preceded by a letter or digit of any script, or `_`
const MENTION = /(?<![\p{L}\p{N}_])@([a-z0-9_]{3,50})(?![a-z0-9_])/giu;

/** Comment text with each `@handle` the API resolved as a mention linked to that profile; other handles stay plain. */
function MentionText({ text, mentions }: { text: string; mentions: Comment['mentions'] }) {
	if (!mentions?.length) return text;
	const handles = new Set(mentions.map((mention) => mention.username.toLowerCase()));
	const parts: React.ReactNode[] = [];
	let last = 0;
	for (const match of text.matchAll(MENTION)) {
		if (!handles.has(match[1].toLowerCase())) continue;
		parts.push(text.slice(last, match.index));
		parts.push(
			<Link key={match.index} href={profileHref(match[1].toLowerCase())} className="font-medium hover:underline">
				{match[0]}
			</Link>
		);
		last = match.index + match[0].length;
	}
	parts.push(text.slice(last));
	return parts;
}

/** Scrolls a comment into view and flashes it, for a copied link or an addressee chip. */
function showComment(id: string) {
	const el = document.getElementById(`comment-${id}`);
	if (!el) return;
	el.scrollIntoView({ block: 'center', behavior: 'smooth' });
	el.animate([{ backgroundColor: 'var(--highlight-tint)' }, { backgroundColor: 'transparent' }], {
		duration: 1200,
		easing: 'ease-out',
	});
}

type CommentThreadProps = {
	thread: CommentsState;
	/** The Poll the thread belongs to, for a comment's link. */
	pollId: string;
	/** The signed-in viewer's user id, to offer edit and delete on their comments. */
	viewerId?: string;
	viewer?: Viewer;
	requireAuth: (action: () => void) => void;
};

/**
 * A copied link names a comment that loads after the page does; this shows it once it has, loading
 * Replies past the previews until it finds the one named. Call it where the thread lives, not in
 * CommentThread, which unmounts when the discussion folds.
 */
export function useCommentLink(thread: CommentsState) {
	const link = useRef<{ rootId: string; replyId?: string } | null>(null);
	const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(scrollTimer.current), []);
	useEffect(() => {
		const match = /^#comment-([^/]+)(?:\/(.+))?$/.exec(window.location.hash);
		if (match) link.current = { rootId: match[1], replyId: match[2] };
	}, []);
	useEffect(() => {
		const target = link.current;
		if (!target || thread.status !== 'ready') return;
		let id = target.rootId;
		if (target.replyId && thread.comments.some((c) => c.id === target.rootId)) {
			const replyList = thread.replies[target.rootId];
			if (!replyList) {
				thread.loadReplies(target.rootId);
				return;
			}
			if (replyList.status === 'loading') return;
			if (replyList.items.some((r) => r.id === target.replyId)) id = target.replyId;
			else if (replyList.status === 'ready' && replyList.nextCursor) {
				thread.loadReplies(target.rootId);
				return;
			}
		}
		link.current = null;
		// Replies the link loaded are still unfolding; scroll once they have their height
		if (id === target.rootId) showComment(id);
		else scrollTimer.current = setTimeout(() => showComment(id), ENTER.duration * 1000);
	});
}

/** Discussion under a Poll. Results stay sealed while it is open, so this is where people argue their case. */
export function CommentThread({ thread, pollId, viewerId, viewer, requireAuth }: CommentThreadProps) {
	const { t } = useLanguage();
	// One inline Reply composer at a time; the main composer folds while it is open
	const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
	// The draft follows the composer to whichever comment it moves to, and goes only on cancel or post
	// Held outside state, so typing re-renders only the composer
	const [replyDraft] = useState(newDraft);
	const activeTarget = replyTarget && thread.comments.some((c) => c.id === replyTarget.rootId) ? replyTarget : null;
	const changeReplyTarget = (target: ReplyTarget | null) => {
		// A draft whose comment left the list was never moved, so it doesn't follow either
		if (!target || !activeTarget) replyDraft.write('');
		setReplyTarget(target);
	};

	return (
		// tabIndex lets focus land here after a comment is deleted
		<section
			id="discussion"
			aria-label={t('comments.title')}
			data-comment-thread
			tabIndex={-1}
			className="space-y-[18px] rounded-2xl border border-border bg-card p-5 outline-none"
		>
			<div className="flex items-baseline gap-2">
				<h2 className="text-title-4">{t('comments.title')}</h2>
				{thread.total !== undefined && (
					<span className="text-caption-1 text-muted-foreground tabular-nums">{thread.total}</span>
				)}
			</div>

			<Composer
				label={t('comments.addComment')}
				placeholder={t('comments.placeholder')}
				avatar={<ViewerAvatar viewer={viewer} className="size-8" />}
				viewerUsername={viewer?.username}
				collapsed={activeTarget !== null}
				className="gap-3"
				requireAuth={requireAuth}
				onPost={async (text) => {
					const ok = await thread.add(text, t('comments.you'));
					if (!ok) toast.error(t('comments.postFailed'));
					return ok;
				}}
			/>

			{thread.status === 'loading' && (
				<div className="space-y-3" aria-busy>
					<Skeleton className="h-12 rounded-lg" />
					<Skeleton className="h-12 rounded-lg" />
				</div>
			)}

			{thread.status === 'error' && (
				<p className="text-caption-1 text-muted-foreground">
					{t('comments.loadFailed')}{' '}
					<button type="button" className="underline" onClick={thread.reload}>
						{t('comments.retry')}
					</button>
				</p>
			)}

			{thread.status === 'ready' && thread.comments.length === 0 && (
				<p className="text-caption-1 text-muted-foreground">{t('comments.empty')}</p>
			)}

			{/* Mounts with the first page, so only comments added later unfold. The gap is padding inside
			    each Unfold, so it grows and folds with the comment instead of snapping. */}
			{thread.status === 'ready' && (
				<ul className="has-[>li]:-mt-5">
					<AnimatePresence initial={false}>
						{thread.comments.map((comment) => (
							<li key={thread.keyOf(comment.id)}>
								<Unfold>
									<div className="pt-5">
										<CommentItem
											comment={comment}
											pollId={pollId}
											viewerId={viewerId}
											viewer={viewer}
											thread={thread}
											requireAuth={requireAuth}
											replyTarget={activeTarget?.rootId === comment.id ? activeTarget : null}
											replyDraft={replyDraft}
											onReplyTargetChange={changeReplyTarget}
										/>
									</div>
								</Unfold>
							</li>
						))}
					</AnimatePresence>
				</ul>
			)}

			{thread.hasMore && (
				<Button
					size="sm"
					variant="ghost"
					className="w-full text-caption-1 text-muted-foreground"
					disabled={thread.isLoadingMore}
					onClick={thread.loadMore}
				>
					{t('comments.loadMore')}
				</Button>
			)}
		</section>
	);
}

/** Who an inline Reply answers: the top-level Comment (`reply` null), or one of its Replies. */
type ReplyTarget = { rootId: string; reply: Comment | null };

type Draft = { read: () => string; write: (text: string) => void };

function newDraft(): Draft {
	let text = '';
	return {
		read: () => text,
		write: (next) => {
			text = next;
		},
	};
}

function Composer({
	onPost,
	requireAuth,
	label,
	placeholder,
	avatar,
	collapsed = false,
	className,
	replyTarget,
	onCancel,
	draft,
	viewerUsername,
}: {
	onPost: (text: string) => Promise<boolean>;
	requireAuth: (action: () => void) => void;
	label: string;
	placeholder: string;
	avatar: React.ReactNode;
	/** Dimmed while a Reply composer is open; it keeps its size, so the comments below stay put. */
	collapsed?: boolean;
	className?: string;
	/** Set for an inline Reply composer; its reply (if any) is named above the field. */
	replyTarget?: ReplyTarget;
	onCancel?: () => void;
	/** Text held outside the composer, so it outlives this one. */
	draft?: Draft;
	/** Signed in: an `@handle` being typed suggests people. */
	viewerUsername?: string;
}) {
	const { t } = useLanguage();
	const fieldId = useId();
	const [text, setTextState] = useState(() => draft?.read() ?? '');
	const setText = (next: string) => {
		draft?.write(next);
		setTextState(next);
	};
	const [isPosting, setIsPosting] = useState(false);
	const trimmed = text.trim();
	const addressee = replyTarget?.reply?.author ?? null;
	const max = textMax(addressee);
	const tooLong = text.length > max;
	const fieldRef = useRef<HTMLTextAreaElement>(null);
	const isInline = !!onCancel;

	const reduceMotion = useReducedMotion();

	// autoFocus would jump the page to a field that is still unfolding; this focuses in place, then
	// scrolls only if the unfolded composer ends up off screen and the viewer hasn't scrolled meanwhile
	useEffect(() => {
		if (!isInline) return;
		const field = fieldRef.current;
		field?.focus({ preventScroll: true });
		const scrollY = window.scrollY;
		const timer = setTimeout(() => {
			if (window.scrollY !== scrollY || document.activeElement !== field) return;
			field?.closest('form')?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
		}, ENTER.duration * 1000);
		return () => clearTimeout(timer);
		// Runs once per composer; a later reduced-motion change doesn't need to refocus it
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isInline]);

	// Signed-out visitors sign in first; the text stays put if they back out
	const submit = () => {
		if (!trimmed || tooLong || isPosting) return;
		requireAuth(async () => {
			setIsPosting(true);
			setText('');
			const ok = await onPost(addressee ? `@${addressee} ${trimmed}` : trimmed);
			setIsPosting(false);
			if (!ok) setText(trimmed);
		});
	};

	return (
		<form
			className={cn(
				'flex items-start',
				collapsed && 'opacity-60 transition-opacity focus-within:opacity-100',
				className
			)}
			onSubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			{avatar}
			<div className="flex min-w-0 flex-1 flex-col gap-2">
				<label htmlFor={fieldId} className="sr-only">
					{label}
				</label>
				{addressee && (
					<div className="flex items-center gap-2 text-caption-3 text-muted-foreground">
						<Reply aria-hidden className="size-[13px] shrink-0" />
						<span className="shrink-0 font-medium">
							{t('comments.replyingTo')} <span className="text-foreground">{addressee}</span>
						</span>
						{replyTarget?.reply?.text && (
							<span className="min-w-0 flex-1 truncate">· {splitAddressee(replyTarget.reply.text).text}</span>
						)}
						<button
							type="button"
							aria-label={t('comments.cancelReply')}
							onClick={onCancel}
							className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
						>
							<X className="size-4" />
						</button>
					</div>
				)}
				<MentionTextarea
					id={fieldId}
					value={text}
					onValueChange={setText}
					viewerUsername={viewerUsername}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
							event.preventDefault();
							submit();
						}
					}}
					placeholder={placeholder}
					ref={fieldRef}
					className="relative min-h-[60px] resize-none"
				/>
				<div className="flex items-center justify-end gap-1.5">
					{text.length > max - COUNTER_WITHIN && (
						<span
							className={cn(
								'mr-auto text-caption-3 tabular-nums',
								tooLong ? 'text-destructive' : 'text-muted-foreground'
							)}
						>
							{text.length} / {max}
						</span>
					)}
					{onCancel && (
						<Button type="button" size="sm" variant="ghost" onClick={onCancel}>
							{t('common.cancel')}
						</Button>
					)}
					<Button type="submit" size="sm" disabled={!trimmed || tooLong || isPosting}>
						{onCancel ? t('comments.reply') : t('comments.post')}
					</Button>
				</div>
			</div>
		</form>
	);
}

type CommentItemProps = {
	comment: Comment;
	pollId: string;
	viewerId?: string;
	thread: CommentsState;
	requireAuth: (action: () => void) => void;
};

/** A top-level Comment and its Replies. Replies are one level deep. */
function CommentItem({
	comment,
	pollId,
	viewerId,
	viewer,
	thread,
	requireAuth,
	replyTarget,
	replyDraft,
	onReplyTargetChange,
}: CommentItemProps & {
	viewer?: Viewer;
	/** The open inline Reply composer, when it answers this Comment or one of its Replies. */
	replyTarget: ReplyTarget | null;
	replyDraft: Draft;
	onReplyTargetChange: (target: ReplyTarget | null) => void;
}) {
	const { t } = useLanguage();
	const replyList = thread.replies[comment.id];
	const replyCount = comment.replyCount ?? 0;
	// Replying to a Reply addresses its author; the API files it under this Comment
	const openComposer = (reply: Comment | null) =>
		requireAuth(() => onReplyTargetChange({ rootId: comment.id, reply }));

	// One button walks the Replies: view them, retry a failed page, or load the ones after those shown
	let repliesAction: string | null = null;
	if (!replyList) {
		if (replyCount > 0) {
			repliesAction = t(replyCount === 1 ? 'comments.viewReply' : 'comments.viewReplies', { count: replyCount });
		}
	} else if (replyList.status === 'error') {
		repliesAction = t('comments.retry');
	} else if (replyList.status === 'ready' && replyList.nextCursor) {
		const more = Math.max(1, replyCount - replyList.items.length);
		repliesAction = t(more === 1 ? 'comments.moreReply' : 'comments.moreReplies', { count: more });
	}

	const replies = replyList?.items ?? [];

	/** The reply a reply's leading `@name` answers: the closest earlier one by that author. */
	const findAddressee = (from: number, author: string) => {
		for (let i = from - 1; i >= 0; i--) if (replies[i].author === author) return replies[i];
		return undefined;
	};

	// Everything that branches off the rail, in order; the composer sits right under what it answers
	const rows: { key: string; className?: string; node: React.ReactNode }[] = [];
	const composerRow = replyTarget && {
		key: `composer-${replyTarget.reply?.id ?? 'root'}`,
		node: (
			<Composer
				label={t('comments.replyPlaceholder')}
				placeholder={t('comments.replyPlaceholder')}
				avatar={<ViewerAvatar viewer={viewer} className="size-6" />}
				viewerUsername={viewer?.username}
				className="min-w-0 flex-1 gap-2.5 pt-1 pb-1.5"
				replyTarget={replyTarget}
				draft={replyDraft}
				requireAuth={requireAuth}
				onCancel={() => onReplyTargetChange(null)}
				onPost={async (text) => {
					// Show the thread the Reply lands in
					if (!replyList && replyCount > 0) await thread.loadReplies(comment.id);
					const ok = await thread.add(text, t('comments.you'), comment.id);
					if (ok) onReplyTargetChange(null);
					else toast.error(t('comments.postFailed'));
					return ok;
				}}
			/>
		),
	};
	if (composerRow && !replyTarget.reply) rows.push(composerRow);
	replies.forEach((reply, index) => {
		const isTarget = replyTarget?.reply?.id === reply.id;
		rows.push({
			key: thread.keyOf(reply.id),
			node: (
				<div
					id={`comment-${reply.id}`}
					className={cn(
						'flex min-w-0 flex-1 items-start gap-2.5 rounded-xl',
						// Within the 8px Unfold leaves past each edge, or the highlight's corners clip
						isTarget && '-mr-2 -ml-1 bg-highlight-tint py-1 pr-2 pl-1'
					)}
				>
					<Avatar comment={reply} size="reply" />
					<CommentBody
						comment={reply}
						pollId={pollId}
						viewerId={viewerId}
						thread={thread}
						requireAuth={requireAuth}
						className="pt-1.5 pb-1.5"
						replying={isTarget}
						onReply={() => openComposer(reply)}
						findAddressee={(author) => findAddressee(index, author)}
					/>
				</div>
			),
		});
		if (composerRow && isTarget) rows.push(composerRow);
	});
	// A reply that left the list (deleted, or its author blocked) hands the composer to the end
	if (composerRow && !rows.includes(composerRow)) rows.push(composerRow);
	if (replyList?.status === 'loading') {
		rows.push({ key: 'loading', node: <Skeleton className="mt-1 h-10 flex-1 rounded-lg" /> });
	}
	if (repliesAction) {
		rows.push({
			key: 'replies-action',
			className: 'items-center',
			node: (
				<button
					type="button"
					// 32px tall; the ::before extends the hit area to 44px
					className="relative mt-0.5 inline-flex h-8 items-center px-0.5 text-caption-2 font-medium text-muted-foreground before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
					onClick={() => thread.loadReplies(comment.id)}
				>
					{repliesAction}
				</button>
			),
		});
	}
	const hasRail = rows.length > 0;

	return (
		<article id={`comment-${comment.id}`} className="flex flex-col">
			<div className="flex items-start gap-3">
				<div className="flex w-8 shrink-0 flex-col items-center self-stretch">
					<Avatar comment={comment} size="root" />
					{hasRail && <div aria-hidden className="mt-1.5 w-0.5 flex-1 bg-border" />}
				</div>
				<CommentBody
					comment={comment}
					pollId={pollId}
					viewerId={viewerId}
					thread={thread}
					requireAuth={requireAuth}
					className={cn('pb-1.5', !hasRail && 'pb-0')}
					replying={replyTarget !== null && replyTarget.reply === null}
					onReply={() => openComposer(null)}
				/>
			</div>

			<AnimatePresence initial={false}>
				{rows.map((row, index) => (
					<Unfold key={row.key}>
						<div className={cn('flex gap-3', row.className ?? 'items-start')}>
							<Elbow continues={index < rows.length - 1} />
							{row.node}
						</div>
					</Unfold>
				))}
			</AnimatePresence>
		</article>
	);
}

/** The root avatar is 32px; a reply's is 24px, sitting on the elbow. */
function Avatar({ comment, size }: { comment: Comment; size: 'root' | 'reply' }) {
	const className = size === 'root' ? 'size-8' : 'mt-1 size-6';
	if (comment.deleted || !comment.author) {
		return <div aria-hidden className={cn('shrink-0 rounded-full border border-dashed border-border-strong', className)} />;
	}
	if (comment.id.startsWith('pending-')) {
		return <UserAvatar username={comment.author} avatarUrl={comment.authorAvatarUrl} className={className} />;
	}
	return <ProfileAvatar username={comment.author} avatarUrl={comment.authorAvatarUrl} className={className} />;
}

type CommentBodyProps = CommentItemProps & {
	className?: string;
	/** The inline Reply composer is open, addressed to this comment. */
	replying: boolean;
	onReply: () => void;
	/** On a reply: the earlier reply its leading `@name` answers, which turns the mention into a chip. */
	findAddressee?: (author: string) => Comment | undefined;
};

function CommentBody({
	comment,
	pollId,
	viewerId,
	thread,
	requireAuth,
	className,
	replying,
	onReply,
	findAddressee,
}: CommentBodyProps) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState('');
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const [confirmingBlock, setConfirmingBlock] = useState(false);
	const [reporting, setReporting] = useState(false);
	// The "…" button gets focus back once whatever the menu opened closes
	const returnFocus = useRef(false);
	const moreRef = useRef<HTMLButtonElement>(null);
	// Closing the delete dialog returns focus to "…", except after a delete: the comment is gone, so
	// focus lands on the discussion (the dialog only focuses tabbable elements, so it is done here)
	const isDeleting = useRef(false);
	useEffect(() => {
		if (!returnFocus.current) return;
		moreRef.current?.focus();
		returnFocus.current = false;
	});
	// autoFocus leaves the caret before the text, so what the author adds would land in front of it
	const editRef = useRef<HTMLTextAreaElement>(null);
	useEffect(() => {
		const field = editRef.current;
		if (!isEditing || !field) return;
		field.focus();
		field.setSelectionRange(field.value.length, field.value.length);
	}, [isEditing]);
	const isPending = comment.id.startsWith('pending-');
	const isOwn = !!viewerId && comment.userId === viewerId;
	const likes = comment.likeCount ?? 0;

	if (comment.deleted || !comment.author) {
		return (
			<p className={cn('min-w-0 flex-1 text-caption-1 leading-8 text-muted-foreground italic', className)}>
				{t('comments.deleted')}
			</p>
		);
	}
	const author = comment.author;
	// Whom "Block" blocks; null on the viewer's own comments and on any without a user ID
	const blockUserId = isOwn ? null : (comment.userId ?? null);
	// A leading `@name` that answers an earlier reply shows as a chip; the text, its edits and copies leave it out
	const mention = splitAddressee(comment.text ?? '');
	const answered = mention.addressee ? findAddressee?.(mention.addressee) : undefined;
	const addressee = answered ? mention.addressee : null;
	const text = answered ? mention.text : (comment.text ?? '');

	const openEdit = () => {
		setDraft(text);
		setIsEditing(true);
	};

	const saveEdit = async () => {
		const body = draft.trim();
		if (!body || body === text.trim()) {
			closeEdit();
			return;
		}
		const next = addressee ? `@${addressee} ${body}` : body;
		if (await thread.edit(comment.id, next)) closeEdit();
		else toast.error(t('comments.editFailed'));
	};

	const closeEdit = () => {
		returnFocus.current = true;
		setIsEditing(false);
	};

	const confirmDelete = async () => {
		const threadEl = moreRef.current?.closest<HTMLElement>('[data-comment-thread]');
		isDeleting.current = true;
		setConfirmingDelete(false);
		const ok = await thread.remove(comment);
		isDeleting.current = false;
		if (ok) threadEl?.focus();
		else {
			moreRef.current?.focus();
			toast.error(t('comments.deleteFailed'));
		}
	};

	const copy = async (value: string, done: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(done);
		} catch {
			toast.error(t('comments.copyFailed'));
		}
	};

	return (
		<div className={cn('flex min-w-0 flex-1 flex-col gap-1', isPending && 'opacity-60', className)}>
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption-3 text-muted-foreground">
				{isPending ? (
					<span className="text-caption-1 font-medium text-foreground">{author}</span>
				) : (
					<ProfileName
						username={author}
						avatarUrl={comment.authorAvatarUrl}
						className="text-caption-1 font-medium text-foreground hover:underline"
					/>
				)}
				{isOwn && (
					<span className={cn(chipClassName, 'bg-highlight px-[7px] py-0.5 text-highlight-foreground')}>
						{t('comments.you')}
					</span>
				)}
				{isEditing ? (
					<span>{t('comments.editing')}</span>
				) : (
					<>
						<time dateTime={comment.createdAt}>
							{isHydrated && formatFromNow(comment.createdAt, currentLanguage)}
						</time>
						{comment.edited && <span>{t('comments.edited')}</span>}
					</>
				)}
			</div>

			{isEditing ? (
				<div className="mt-1 flex flex-col gap-2">
					<Textarea
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						aria-label={t('comments.edit')}
						maxLength={textMax(addressee)}
						rows={3}
						className="resize-none"
						ref={editRef}
					/>
					<div className="flex items-center gap-1.5">
						<span className="mr-auto text-caption-3 text-muted-foreground tabular-nums">
							{draft.length} / {textMax(addressee)}
						</span>
						<Button size="sm" variant="ghost" onClick={closeEdit}>
							{t('common.cancel')}
						</Button>
						<Button size="sm" onClick={saveEdit}>
							{t('common.save')}
						</Button>
					</div>
				</div>
			) : (
				<>
					{addressee && (
						<button
							type="button"
							aria-label={`${t('comments.replyingTo')} ${addressee}`}
							onClick={() => answered && showComment(answered.id)}
							className="inline-flex h-[22px] items-center gap-1.5 self-start rounded-full border border-border-strong pr-2 pl-1.5 text-caption-3 font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring"
						>
							<Reply aria-hidden className="size-3" strokeWidth={2.2} />
							{addressee}
						</button>
					)}
					<p className="text-caption-1 leading-normal break-words whitespace-pre-wrap text-foreground">
						<MentionText text={text} mentions={comment.mentions} />
					</p>
				</>
			)}

			{!isPending && !isEditing && (
				<div className="-ml-2.5 mt-0.5 flex items-center gap-0.5">
					<button
						type="button"
						aria-pressed={!!comment.likedByCurrentUser}
						aria-label={t('comments.like')}
						onClick={() => requireAuth(() => thread.toggleLike(comment))}
						className={cn(pillClassName, comment.likedByCurrentUser && 'bg-highlight-tint text-foreground')}
					>
						<m.span
							key={comment.likedByCurrentUser ? 'liked' : 'unliked'}
							initial={{ scale: comment.likedByCurrentUser ? 0.4 : 1 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
							className="inline-flex"
						>
							<Heart className={cn('size-[15px]', comment.likedByCurrentUser && 'fill-current')} strokeWidth={1.8} />
						</m.span>
						{likes > 0 && <span className="tabular-nums">{likes}</span>}
					</button>

					<button
						type="button"
						aria-pressed={replying}
						onClick={onReply}
						className={cn(pillClassName, replying && 'text-foreground')}
					>
						<Reply aria-hidden className="size-[15px]" strokeWidth={1.8} />
						{replying ? t('comments.replying') : t('comments.reply')}
					</button>

					{!replying && (
						<Menu.Root>
							<Menu.Trigger
								ref={moreRef}
								aria-label={t('comments.more')}
								className={cn(pillClassName, 'w-9 justify-center px-0 data-popup-open:bg-field data-popup-open:text-foreground md:w-8')}
							>
								<Ellipsis className="size-4" fill="currentColor" />
							</Menu.Trigger>
							<Menu.Portal>
								<Menu.Positioner side="bottom" align="start" sideOffset={4} className="z-50">
									<Menu.Popup className={cn(menuPopupClassName, 'w-60')}>
										{isOwn && (
											<Menu.Item className={menuItemClassName} onClick={openEdit}>
												<Pencil aria-hidden strokeWidth={1.8} />
												{t('comments.edit')}
											</Menu.Item>
										)}
										<Menu.Item className={menuItemClassName} onClick={() => copy(text, t('comments.textCopied'))}>
											<Copy aria-hidden strokeWidth={1.8} />
											{t('comments.copyText')}
										</Menu.Item>
										<Menu.Item
											className={menuItemClassName}
											onClick={() => copy(`${pollUrl(pollId)}${commentHash(comment)}`, t('comments.linkCopied'))}
										>
											<Link2 aria-hidden strokeWidth={1.8} />
											{t('comments.copyLink')}
										</Menu.Item>
										<Menu.Separator className="mx-1 my-1.5 h-px bg-border" />
										{isOwn ? (
											<Menu.Item
												className={cn(menuItemClassName, 'text-destructive')}
												onClick={() => setConfirmingDelete(true)}
											>
												<Trash2 aria-hidden strokeWidth={1.8} />
												{t('common.delete')}
											</Menu.Item>
										) : (
											<>
												<Menu.Item className={menuItemClassName} onClick={() => requireAuth(() => setReporting(true))}>
													<TriangleAlert aria-hidden strokeWidth={1.8} />
													{t('comments.report')}
												</Menu.Item>
												{blockUserId && (
													<Menu.Item
														className={cn(menuItemClassName, 'text-destructive')}
														onClick={() => requireAuth(() => setConfirmingBlock(true))}
													>
														<Ban aria-hidden strokeWidth={1.8} />
														{t('blocks.block')}
													</Menu.Item>
												)}
											</>
										)}
									</Menu.Popup>
								</Menu.Positioner>
							</Menu.Portal>
						</Menu.Root>
					)}

					<AlertDialog
						open={confirmingDelete}
						onOpenChange={setConfirmingDelete}
					>
						<AlertDialogContent className="sm:max-w-[440px]" finalFocus={() => (isDeleting.current ? false : moreRef.current)}>
							<AlertDialogHeader>
								<AlertDialogTitle>{t('comments.deleteConfirm')}</AlertDialogTitle>
								<AlertDialogDescription className="text-body-4">
									{(comment.replyCount ?? 0) > 0
										? t(comment.replyCount === 1 ? 'comments.deleteBodyReply' : 'comments.deleteBodyReplies', {
												count: comment.replyCount ?? 0,
											})
										: t('comments.deleteBody')}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<blockquote className="line-clamp-3 rounded-xl border border-border bg-surface-soft px-3.5 py-2.5 text-body-4 leading-normal text-muted-foreground">
								{text}
							</blockquote>
							<AlertDialogFooter>
								<AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
								<AlertDialogAction variant="destructive" onClick={confirmDelete}>
									{t('common.delete')}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					{!isOwn && (
						<ReportCommentDialog
							pollId={pollId}
							commentId={comment.id}
							open={reporting}
							onOpenChange={(open) => {
								setReporting(open);
								if (!open) returnFocus.current = true;
							}}
						/>
					)}

					{blockUserId && (
						<BlockUserDialog
							userId={blockUserId}
							username={author}
							open={confirmingBlock}
							onOpenChange={(open) => {
								setConfirmingBlock(open);
								if (!open) returnFocus.current = true;
							}}
							// Their comments leave the list, this one included, so focus moves to the discussion
							onBlocked={() => {
								moreRef.current?.closest<HTMLElement>('[data-comment-thread]')?.focus();
								thread.dropUser(blockUserId);
							}}
						/>
					)}
				</div>
			)}
		</div>
	);
}
