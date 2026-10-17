'use client';

import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Heart } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserAvatar } from '@/features/avatars/UserAvatar';
import { ProfileAvatar, ProfileName } from '@/features/profiles/UserChip';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow } from '../format';
import type { CommentsState } from '../hooks/useComments';
import type { Comment } from '../schema';
import { CreateCommentRequestSchema } from '../schema';

const COMMENT_MAX = CreateCommentRequestSchema.shape.text.maxLength ?? 2000;
const COUNTER_FROM = COMMENT_MAX - 200;
// Small text links with a 44px tall hit area; the negative margins keep the row compact, so rows
// around them need at least 16px (space-y-4) between them or the hit areas overlap
const actionClassName = 'inline-flex min-h-11 -my-3.5 -mx-1.5 items-center px-1.5';

type CommentThreadProps = {
	thread: CommentsState;
	/** The signed-in viewer's user id, to offer edit and delete on their comments. */
	viewerId?: string;
	requireAuth: (action: () => void) => void;
};

/** Discussion under a Poll. Results stay sealed while it is open, so this is where people argue their case. */
export function CommentThread({ thread, viewerId, requireAuth }: CommentThreadProps) {
	const { t } = useLanguage();

	return (
		// tabIndex lets focus land here after a comment is deleted
		<section
			aria-label={t('comments.title')}
			data-comment-thread
			tabIndex={-1}
			className="space-y-4 border-t border-border/60 px-5 py-4 outline-none"
		>
			<Composer
				placeholder={t('comments.placeholder')}
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
				<p className="text-sm text-muted-foreground">
					{t('comments.loadFailed')}{' '}
					<button type="button" className="underline" onClick={thread.reload}>
						{t('comments.retry')}
					</button>
				</p>
			)}

			{thread.status === 'ready' && thread.comments.length === 0 && (
				<p className="text-sm text-muted-foreground">{t('comments.empty')}</p>
			)}

			<ul className="space-y-4">
				<AnimatePresence initial={false}>
					{thread.comments.map((comment) => (
						<m.li
							key={comment.id}
							layout
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
						>
							<CommentItem
								comment={comment}
								viewerId={viewerId}
								thread={thread}
								requireAuth={requireAuth}
							/>
						</m.li>
					))}
				</AnimatePresence>
			</ul>

			{thread.hasMore && (
				<Button
					size="sm"
					variant="ghost"
					className="w-full text-muted-foreground"
					disabled={thread.isLoadingMore}
					onClick={thread.loadMore}
				>
					{t('comments.loadMore')}
				</Button>
			)}
		</section>
	);
}

function Composer({
	onPost,
	requireAuth,
	placeholder,
	initialText = '',
	onCancel,
}: {
	onPost: (text: string) => Promise<boolean>;
	requireAuth: (action: () => void) => void;
	placeholder: string;
	initialText?: string;
	/** Shown for an inline Reply composer. */
	onCancel?: () => void;
}) {
	const { t } = useLanguage();
	const [text, setText] = useState(initialText);
	const [isPosting, setIsPosting] = useState(false);
	const trimmed = text.trim();
	const tooLong = text.length > COMMENT_MAX;

	// Signed-out visitors sign in first; the text stays put if they back out
	const submit = () => {
		if (!trimmed || tooLong || isPosting) return;
		requireAuth(async () => {
			setIsPosting(true);
			setText('');
			const ok = await onPost(trimmed);
			setIsPosting(false);
			if (!ok) setText(trimmed);
		});
	};

	return (
		<form
			className="space-y-2"
			onSubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<Textarea
				value={text}
				onChange={(event) => setText(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
						event.preventDefault();
						submit();
					}
				}}
				placeholder={placeholder}
				aria-label={placeholder}
				rows={2}
				autoFocus={!!onCancel}
				className="min-h-[60px] resize-none text-sm"
			/>
			<div className="flex items-center justify-end gap-3">
				{text.length > COUNTER_FROM && (
					<span
						className={cn(
							'font-mono text-xs tabular-nums',
							tooLong ? 'text-destructive' : 'text-muted-foreground'
						)}
					>
						{text.length}/{COMMENT_MAX}
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
		</form>
	);
}

type CommentItemProps = {
	comment: Comment;
	viewerId?: string;
	thread: CommentsState;
	requireAuth: (action: () => void) => void;
	/** Opens the top-level Comment's Reply composer, addressed to this author. */
	onReply?: (author: string) => void;
};

/** A top-level Comment and its Replies. Replies are one level deep. */
function CommentItem(props: Omit<CommentItemProps, 'onReply'>) {
	const { comment, viewerId, thread, requireAuth } = props;
	const { t } = useLanguage();
	// Replying to a Reply addresses its author; the API files it under this Comment
	const [replyPrefix, setReplyPrefix] = useState<string | null>(null);
	const replyList = thread.replies[comment.id];
	const replyCount = comment.replyCount ?? 0;
	const openComposer = (author?: string | null) =>
		requireAuth(() => setReplyPrefix(author ? `@${author} ` : ''));

	// One button walks the Replies: view them, retry a failed page, or load more
	let repliesAction: string | null = null;
	if (!replyList) {
		if (replyCount > 0) {
			repliesAction = t(replyCount === 1 ? 'comments.viewReply' : 'comments.viewReplies', { count: replyCount });
		}
	} else if (replyList.status === 'error') {
		repliesAction = t('comments.retry');
	} else if (replyList.status === 'ready' && replyList.nextCursor) {
		repliesAction = t('comments.moreReplies');
	}

	return (
		<div className="space-y-4">
			<CommentBody {...props} onReply={() => openComposer()} />
			{(replyCount > 0 || replyList || replyPrefix !== null) && (
				<div className="ml-11 space-y-4 border-l border-border/60 pl-3">
					{replyList && (
						<ul className="space-y-4">
							{replyList.items.map((reply) => (
								<li key={reply.id}>
									<CommentBody
										comment={reply}
										viewerId={viewerId}
										thread={thread}
										requireAuth={requireAuth}
										onReply={(author) => openComposer(author)}
									/>
								</li>
							))}
						</ul>
					)}
					{replyList?.status === 'loading' && <Skeleton className="h-10 rounded-lg" />}
					{repliesAction && (
						<button
							type="button"
							// Takes its full 44px in the stack, so it never shares a hit area with a neighbor
							className="-mx-1.5 inline-flex min-h-11 items-center px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
							onClick={() => thread.loadReplies(comment.id)}
						>
							{repliesAction}
						</button>
					)}
					{replyPrefix !== null && (
						<Composer
							key={replyPrefix}
							placeholder={t('comments.replyPlaceholder')}
							initialText={replyPrefix}
							requireAuth={requireAuth}
							onCancel={() => setReplyPrefix(null)}
							onPost={async (text) => {
								// Show the thread the Reply lands in
								if (!replyList && replyCount > 0) await thread.loadReplies(comment.id);
								const ok = await thread.add(text, t('comments.you'), comment.id);
								if (ok) setReplyPrefix(null);
								else toast.error(t('comments.postFailed'));
								return ok;
							}}
						/>
					)}
				</div>
			)}
		</div>
	);
}

function CommentBody({ comment, viewerId, thread, requireAuth, onReply }: CommentItemProps) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(comment.text ?? '');
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	// The control that unmounted when an edit or delete closes gets focus back once it's rendered again
	const returnFocus = useRef<'edit' | 'delete' | null>(null);
	const editRef = useRef<HTMLButtonElement>(null);
	const deleteRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (!returnFocus.current) return;
		(returnFocus.current === 'edit' ? editRef : deleteRef).current?.focus();
		returnFocus.current = null;
	});
	const isPending = comment.id.startsWith('pending-');
	const isOwn = !!viewerId && comment.userId === viewerId;
	const likes = comment.likeCount ?? 0;

	if (comment.deleted || !comment.author) {
		return (
			<article className="flex gap-3">
				<div aria-hidden className="size-8 shrink-0 rounded-full border border-dashed border-border" />
				<p className="pt-1.5 text-sm italic text-muted-foreground">{t('comments.deleted')}</p>
			</article>
		);
	}
	const author = comment.author;

	const saveEdit = async () => {
		const text = draft.trim();
		if (!text || text === comment.text) {
			closeEdit();
			return;
		}
		if (await thread.edit(comment.id, text)) closeEdit();
		else toast.error(t('comments.editFailed'));
	};

	const closeEdit = () => {
		returnFocus.current = 'edit';
		setIsEditing(false);
	};

	const confirmDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
		const threadEl = event.currentTarget.closest<HTMLElement>('[data-comment-thread]');
		setConfirmingDelete(false);
		if (await thread.remove(comment)) threadEl?.focus();
		else {
			deleteRef.current?.focus();
			toast.error(t('comments.deleteFailed'));
		}
	};

	return (
		<article className={cn('flex gap-3', isPending && 'opacity-60')}>
			{isPending ? (
				<UserAvatar username={author} avatarUrl={comment.authorAvatarUrl} />
			) : (
				<ProfileAvatar username={author} avatarUrl={comment.authorAvatarUrl} />
			)}
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-x-2 text-xs">
					{isPending ? (
						<span className="font-medium text-foreground">{author}</span>
					) : (
						<ProfileName
							username={author}
							avatarUrl={comment.authorAvatarUrl}
							className="font-medium text-foreground hover:underline"
						/>
					)}
					<time dateTime={comment.createdAt} className="text-muted-foreground">
						{isHydrated && formatFromNow(comment.createdAt, currentLanguage)}
					</time>
					{comment.edited && <span className="text-muted-foreground">{t('comments.edited')}</span>}
				</div>

				{isEditing ? (
					<div className="mt-1.5 space-y-2">
						<Textarea
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							aria-label={t('comments.edit')}
							maxLength={COMMENT_MAX}
							rows={2}
							className="resize-none"
							autoFocus
						/>
						<div className="flex justify-end gap-1.5">
							<Button size="sm" variant="ghost" onClick={closeEdit}>
								{t('common.cancel')}
							</Button>
							<Button size="sm" onClick={saveEdit}>
								{t('common.save')}
							</Button>
						</div>
					</div>
				) : (
					<p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
						{comment.text}
					</p>
				)}

				{!isPending && !isEditing && (
					<div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
						<button
							type="button"
							aria-pressed={!!comment.likedByCurrentUser}
							aria-label={t('comments.like')}
							onClick={() => requireAuth(() => thread.toggleLike(comment))}
							className={cn(
								actionClassName,
								'gap-1 transition-colors hover:text-foreground',
								comment.likedByCurrentUser && 'text-foreground'
							)}
						>
							<m.span
								key={comment.likedByCurrentUser ? 'liked' : 'unliked'}
								initial={{ scale: comment.likedByCurrentUser ? 0.4 : 1 }}
								animate={{ scale: 1 }}
								transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
								className="inline-flex"
							>
								<Heart className={cn('size-3.5', comment.likedByCurrentUser && 'fill-current')} />
							</m.span>
							{likes > 0 && <span className="tabular-nums">{likes}</span>}
						</button>

						{onReply && (
							<button type="button" className={cn(actionClassName, 'hover:text-foreground')} onClick={() => onReply(author)}>
								{t('comments.reply')}
							</button>
						)}
						{isOwn && !confirmingDelete && (
							<>
								<button
									ref={editRef}
									type="button"
									className={cn(actionClassName, 'hover:text-foreground')}
									onClick={() => setIsEditing(true)}
								>
									{t('comments.edit')}
								</button>
								<button
									ref={deleteRef}
									type="button"
									className={cn(actionClassName, 'hover:text-destructive')}
									onClick={() => setConfirmingDelete(true)}
								>
									{t('common.delete')}
								</button>
							</>
						)}
						{confirmingDelete && (
							<span role="group" aria-label={t('comments.deleteConfirm')} className="flex items-center gap-2">
								<span>{t('comments.deleteConfirm')}</span>
								<button type="button" className={cn(actionClassName, 'font-medium text-destructive')} onClick={confirmDelete}>
									{t('common.delete')}
								</button>
								<button
									type="button"
									className={cn(actionClassName, 'hover:text-foreground')}
									onClick={() => {
										returnFocus.current = 'delete';
										setConfirmingDelete(false);
									}}
								>
									{t('common.cancel')}
								</button>
							</span>
						)}
					</div>
				)}
			</div>
		</article>
	);
}
