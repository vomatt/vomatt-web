'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { profileHref } from '@/lib/routes';

import { formatFromNow } from '../format';
import { useBallot } from '../hooks/useBallot';
import { useComments } from '../hooks/useComments';
import { useRequireAuth } from '../hooks/useRequireAuth';
import type { Poll } from '../schema';
import { getPoll } from '../service';
import { derivePollStatus } from '../status';
import { Ballot } from './Ballot';
import { CommentThread } from './CommentThread';
import { OwnerActions } from './OwnerActions';
import { PollFooter } from './PollFooter';
import { Results } from './Results';
import { StatusChip } from './StatusChip';
import { VoterList } from './VoterList';

interface PollCardProps {
	poll: Poll;
	/** The signed-in viewer's user id (the session `sub`). */
	viewerId?: string;
	/** The detail page opens the discussion right away. */
	defaultShowComments?: boolean;
}

/** Shows the Ballot until the Poll Ends, then the Results. Whether the viewer voted doesn't matter. */
export function PollCard({ poll: initialPoll, viewerId, defaultShowComments = false }: PollCardProps) {
	const { currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [poll, setPoll] = useState(initialPoll);
	const [showComments, setShowComments] = useState(defaultShowComments);
	const { isAuthed, requireAuth, authDialog } = useRequireAuth(!!viewerId);
	const thread = useComments(initialPoll.id, {
		enabled: showComments,
		initialTotal: initialPoll.commentCount,
	});

	const refetch = useCallback(async () => {
		const fresh = await getPoll(poll.id).catch(() => null);
		if (fresh) setPoll(fresh);
	}, [poll.id]);

	const ballot = useBallot(poll, { isAuthed, onPollEnded: refetch });
	const status = derivePollStatus(poll);
	const { id, title, description, creatorId, creatorUsername, createdAt } = poll;
	const isOwner = !!viewerId && viewerId === creatorId;
	const canSeeVoters =
		poll.voterVisibility === 'signed-in' ? isAuthed : poll.voterVisibility === 'owner' && isOwner;

	return (
		<article className="group bg-card border border-border rounded-xl">
			<div className="p-4 space-y-4 md:p-6">
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
						<Link
							href={profileHref(creatorUsername)}
							className="truncate font-medium hover:text-foreground transition-colors"
						>
							{creatorUsername}
						</Link>
						<time dateTime={createdAt} className="shrink-0 whitespace-nowrap">
							{isHydrated && formatFromNow(createdAt, currentLanguage)}
						</time>
					</div>
					<StatusChip status={status} poll={poll} />
				</div>

				<div>
					<Link href={`/poll/${id}`}>
						<h3 className="text-[22px] font-normal leading-tight tracking-[-0.02em] text-foreground hover:text-muted-foreground transition-colors md:text-2xl">
							{title}
						</h3>
					</Link>
					{description && (
						<p className="mt-2 max-w-[65ch] text-[15px] text-muted-foreground leading-relaxed">
							{description}
						</p>
					)}
				</div>

				{/* When a Poll ends while open on screen, the Ballot gives way to the Results */}
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={status === 'ended' ? 'results' : 'ballot'}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						{status === 'ended' ? (
							<div className="space-y-2">
								<Results
									poll={poll}
									myOptionId={ballot.myOptionId}
									turnout={ballot.turnout}
									onSealed={refetch}
								/>
								{canSeeVoters && <VoterList poll={poll} />}
							</div>
						) : (
							<Ballot
								poll={poll}
								status={status}
								ballot={ballot}
								requireAuth={requireAuth}
								ownerActions={isOwner && <OwnerActions poll={poll} onChanged={refetch} />}
							/>
						)}
					</motion.div>
				</AnimatePresence>
			</div>

			<PollFooter
				pollId={id}
				title={title}
				turnout={ballot.turnout}
				commentCount={thread.total}
				onToggleComments={() => setShowComments((value) => !value)}
			/>

			{showComments && (
				<CommentThread thread={thread} viewerId={viewerId} requireAuth={requireAuth} />
			)}

			{authDialog.open && <AuthDialog {...authDialog} />}
		</article>
	);
}
