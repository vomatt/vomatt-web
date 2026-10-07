'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';

import { formatFromNow } from '../format';
import { useBallot } from '../hooks/useBallot';
import { useRequireAuth } from '../hooks/useRequireAuth';
import type { Comment, Poll } from '../schema';
import { getPollForViewer } from '../service';
import { derivePollStatus } from '../status';
import { Ballot } from './Ballot';
import { CardComments } from './CardComments';
import { OwnerActions } from './OwnerActions';
import { PollFooter } from './PollFooter';
import { Results } from './Results';
import { StatusChip } from './StatusChip';

interface PollCardProps {
	poll: Poll;
	/** The signed-in viewer's user id (the session `sub`). */
	viewerId?: string;
}

/** Shows the Ballot until the Poll Ends, then the Results. Whether the viewer voted doesn't matter. */
export function PollCard({ poll: initialPoll, viewerId }: PollCardProps) {
	const { currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [poll, setPoll] = useState(initialPoll);
	const [showComments, setShowComments] = useState(false);
	const [comments, setComments] = useState<Comment[]>([]);
	const { isAuthed, requireAuth, authDialog } = useRequireAuth(!!viewerId);

	const refetch = useCallback(async () => {
		const fresh = await getPollForViewer(poll.id).catch(() => null);
		if (fresh) setPoll(fresh);
	}, [poll.id]);

	const ballot = useBallot(poll, { isAuthed, onPollEnded: refetch });
	const status = derivePollStatus(poll);
	const { id, title, description, creatorId, creatorUsername, createdAt } = poll;
	const isOwner = !!viewerId && viewerId === creatorId;

	return (
		<article className="group bg-card border border-border rounded-xl transition-shadow duration-200 hover:shadow-sm">
			<div className="p-5 space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<Link
							href={`/profile/${creatorUsername}`}
							className="font-medium text-foreground/60 hover:text-foreground transition-colors"
						>
							{creatorUsername}
						</Link>
						<span>·</span>
						<time dateTime={createdAt}>
							{isHydrated && formatFromNow(createdAt, currentLanguage)}
						</time>
					</div>
					<StatusChip status={status} poll={poll} />
				</div>

				<div>
					<Link href={`/poll/${id}`}>
						<h3 className="text-[17px] font-semibold leading-snug text-foreground hover:text-foreground/75 transition-colors">
							{title}
						</h3>
					</Link>
					{description && (
						<p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
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
							<Results
								poll={poll}
								myOptionId={ballot.myOptionId}
								turnout={ballot.turnout}
								onSealed={refetch}
							/>
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
				commentCount={comments.length}
				onToggleComments={() => setShowComments((value) => !value)}
			/>

			{showComments && (
				<CardComments
					pollId={id}
					comments={comments}
					setComments={setComments}
					requireAuth={requireAuth}
				/>
			)}

			{authDialog.open && <AuthDialog {...authDialog} />}
		</article>
	);
}
