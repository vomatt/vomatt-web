'use client';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { CommentThread, useCommentLink } from '@/features/polls/components/CommentThread';
import { useComments } from '@/features/polls/hooks/useComments';
import { useRequireAuth } from '@/features/polls/hooks/useRequireAuth';

type PollDiscussionProps = {
	pollId: string;
	commentCount?: number;
	viewerId?: string;
	viewer?: { username: string; avatarUrl: string | null };
};

/** The poll page's discussion, its own card under the poll's. */
export function PollDiscussion({ pollId, commentCount, viewerId, viewer }: PollDiscussionProps) {
	const { requireAuth, authDialog } = useRequireAuth(!!viewerId);
	const thread = useComments(pollId, { enabled: true, initialTotal: commentCount });
	useCommentLink(thread);

	return (
		<>
			<CommentThread thread={thread} pollId={pollId} viewerId={viewerId} viewer={viewer} requireAuth={requireAuth} />
			{authDialog.open && <AuthDialog {...authDialog} />}
		</>
	);
}
