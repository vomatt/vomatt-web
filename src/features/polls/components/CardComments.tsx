'use client';

import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';

import type { Comment } from '../schema';
import { postComment } from '../service';

type CardCommentsProps = {
	pollId: string;
	comments: Comment[];
	setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
	requireAuth: (action: () => void) => void;
};

/** Inline comments on the card. Stage 4 replaces this with CommentThread. */
export function CardComments({ pollId, comments, setComments, requireAuth }: CardCommentsProps) {
	const [commentText, setCommentText] = useState('');
	const [isPostingComment, setIsPostingComment] = useState(false);

	const submit = async (text: string) => {
		setIsPostingComment(true);
		const optimistic = {
			id: `local-${Date.now()}`,
			author: 'You',
			text,
			createdAt: new Date().toISOString(),
		};
		setComments((prev) => [...prev, optimistic]);
		setCommentText('');

		try {
			await postComment(pollId, text);
		} catch {
			// Revert optimistic comment on failure
			setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
		} finally {
			setIsPostingComment(false);
		}
	};

	const handleComment = () => {
		const text = commentText.trim();
		if (!text || isPostingComment) return;
		requireAuth(() => submit(text));
	};

	return (
		<div className="space-y-3 border-t border-border/60 px-5 py-3">
			{comments.map((comment) => (
				<div key={comment.id} className="pl-3 border-l-2 border-border">
					<div className="flex items-center gap-2 text-xs mb-0.5">
						<span className="font-medium text-foreground/70">{comment.author}</span>
						<span className="text-muted-foreground/40">
							{formatDistance(new Date(comment.createdAt), new Date(), {
								locale: enUS,
							})}{' '}
							ago
						</span>
					</div>
					<p className="text-sm text-foreground/65">{comment.text}</p>
				</div>
			))}

			<div className="flex gap-2 pt-1">
				<input
					type="text"
					value={commentText}
					onChange={(e) => setCommentText(e.target.value)}
					placeholder="Add a comment…"
					className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/30 transition-all"
					onKeyDown={(e) => e.key === 'Enter' && handleComment()}
				/>
				<Button onClick={handleComment} size="sm" disabled={isPostingComment} className="px-4">
					Post
				</Button>
			</div>
		</div>
	);
}
