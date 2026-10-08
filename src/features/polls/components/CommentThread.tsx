'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { InitialAvatar } from '@/components/ui/InitialAvatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Heart } from '@/components/ui/SvgIcons';
import { Textarea } from '@/components/ui/Textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow } from '../format';
import type { CommentsState } from '../hooks/useComments';
import type { Comment } from '../schema';
import { CreateCommentRequestSchema } from '../schema';

const COMMENT_MAX = CreateCommentRequestSchema.shape.text.maxLength ?? 2000;
const COUNTER_FROM = COMMENT_MAX - 200;

type CommentThreadProps = {
	thread: CommentsState;
	/** The signed-in viewer's user id, to offer edit and delete on their comments. */
	viewerId?: string;
	requireAuth: (action: () => void) => void;
};

/** Discussion under a Poll. Results stay sealed while it is open, so this is where people argue their case. */
export function CommentThread({ thread, viewerId, requireAuth }: CommentThreadProps) {
	const { t } = useLanguage();

	if (thread.status === 'signed-out') {
		return (
			<div className="border-t border-border/60 px-5 py-4 text-center">
				<p className="mb-3 text-sm text-muted-foreground">{t('comments.signInToRead')}</p>
				<Button size="sm" variant="outline" onClick={() => requireAuth(() => thread.reload())}>
					{t('comments.signIn')}
				</Button>
			</div>
		);
	}

	return (
		<section aria-label={t('comments.title')} className="space-y-4 border-t border-border/60 px-5 py-4">
			<Composer
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
						<motion.li
							key={comment.id}
							layout
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2 }}
						>
							<CommentItem
								comment={comment}
								isOwn={!!viewerId && comment.userId === viewerId}
								thread={thread}
								requireAuth={requireAuth}
							/>
						</motion.li>
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
}: {
	onPost: (text: string) => Promise<boolean>;
	requireAuth: (action: () => void) => void;
}) {
	const { t } = useLanguage();
	const [text, setText] = useState('');
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
				placeholder={t('comments.placeholder')}
				aria-label={t('comments.placeholder')}
				rows={2}
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
				<Button type="submit" size="sm" disabled={!trimmed || tooLong || isPosting}>
					{t('comments.post')}
				</Button>
			</div>
		</form>
	);
}

function CommentItem({
	comment,
	isOwn,
	thread,
	requireAuth,
}: {
	comment: Comment;
	isOwn: boolean;
	thread: CommentsState;
	requireAuth: (action: () => void) => void;
}) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(comment.text);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const isPending = comment.id.startsWith('pending-');
	const likes = comment.likeCount ?? 0;

	const saveEdit = async () => {
		const text = draft.trim();
		if (!text || text === comment.text) {
			setIsEditing(false);
			return;
		}
		if (await thread.edit(comment.id, text)) setIsEditing(false);
		else toast.error(t('comments.editFailed'));
	};

	const confirmDelete = async () => {
		setConfirmingDelete(false);
		if (!(await thread.remove(comment.id))) toast.error(t('comments.deleteFailed'));
	};

	return (
		<article className={cn('flex gap-3', isPending && 'opacity-60')}>
			<InitialAvatar name={comment.author} />
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-x-2 text-xs">
					{isPending ? (
						<span className="font-medium text-foreground">{comment.author}</span>
					) : (
						<Link href={`/profile/${comment.author}`} className="font-medium text-foreground hover:underline">
							{comment.author}
						</Link>
					)}
					<time dateTime={comment.createdAt} className="text-muted-foreground">
						{isHydrated && formatFromNow(comment.createdAt, currentLanguage)}
					</time>
					{comment.edited && <span className="text-muted-foreground">· {t('comments.edited')}</span>}
				</div>

				{isEditing ? (
					<div className="mt-1.5 space-y-2">
						<Textarea
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							aria-label={t('comments.edit')}
							maxLength={COMMENT_MAX}
							rows={2}
							className="resize-none text-sm"
							autoFocus
						/>
						<div className="flex justify-end gap-1.5">
							<Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
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
								'flex items-center gap-1 transition-colors hover:text-foreground',
								comment.likedByCurrentUser && 'text-rose-500 hover:text-rose-500'
							)}
						>
							<motion.span
								key={comment.likedByCurrentUser ? 'liked' : 'unliked'}
								initial={{ scale: comment.likedByCurrentUser ? 0.4 : 1 }}
								animate={{ scale: 1 }}
								transition={{ type: 'spring', stiffness: 600, damping: 12 }}
								className="inline-flex"
							>
								<Heart className={cn('size-3.5', comment.likedByCurrentUser && 'fill-current')} />
							</motion.span>
							{likes > 0 && <span className="tabular-nums">{likes}</span>}
						</button>

						{isOwn && !confirmingDelete && (
							<>
								<button type="button" className="hover:text-foreground" onClick={() => setIsEditing(true)}>
									{t('comments.edit')}
								</button>
								<button type="button" className="hover:text-destructive" onClick={() => setConfirmingDelete(true)}>
									{t('common.delete')}
								</button>
							</>
						)}
						{confirmingDelete && (
							<span role="group" aria-label={t('comments.deleteConfirm')} className="flex items-center gap-2">
								<span>{t('comments.deleteConfirm')}</span>
								<button type="button" className="font-medium text-destructive" onClick={confirmDelete}>
									{t('common.delete')}
								</button>
								<button type="button" className="hover:text-foreground" onClick={() => setConfirmingDelete(false)}>
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
