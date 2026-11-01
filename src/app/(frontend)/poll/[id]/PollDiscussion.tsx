'use client';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { CommentThread, useCommentLink } from '@/features/polls/components/CommentThread';
import { PollCard } from '@/features/polls/components/PollCard';
import { useComments } from '@/features/polls/hooks/useComments';
import { useRequireAuth } from '@/features/polls/hooks/useRequireAuth';
import type { Poll } from '@/features/polls/schema';

type PollDiscussionProps = {
	pollId: string;
	commentCount?: number;
	viewerId?: string;
	viewer?: { username: string; avatarUrl: string | null };
	/** The poll's card, drawn above with the thread's count so its Comments count and the Discussion's agree. */
	poll?: Poll;
	anonymousByDefault?: boolean;
};

/** The poll page's discussion, its own card under the poll's, which it draws when given the poll. */
export function PollDiscussion({ pollId, commentCount, viewerId, viewer, poll, anonymousByDefault }: PollDiscussionProps) {
	const { requireAuth, authDialog } = useRequireAuth(!!viewerId);
	const thread = useComments(pollId, { enabled: true, initialTotal: commentCount });
	const replyTo = useCommentLink(thread);

	return (
		<>
			{poll && (
				<PollCard
					poll={poll}
					viewerId={viewerId}
					anonymousByDefault={anonymousByDefault}
					commentCount={thread.total}
					deletedHref="/my-polls"
					headingLevel="h1"
					isPage
				/>
			)}
			<CommentThread thread={thread} pollId={pollId} viewerId={viewerId} viewer={viewer} requireAuth={requireAuth} replyTo={replyTo} />
			{authDialog.open && <AuthDialog {...authDialog} />}
		</>
	);
}
