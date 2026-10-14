'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { AudienceLabel } from './AudienceLabel';
import { Ballot } from './Ballot';
import { CommentThread } from './CommentThread';
import { getOwnerActions, OwnerActions } from './OwnerActions';
import { PollFooter } from './PollFooter';
import { type ResultRow, Results } from './Results';
import { StatusChip } from './StatusChip';
import { useVoters, VotersDialog } from './VoterList';

interface PollCardProps {
	poll: Poll;
	/** The signed-in viewer's user id (the session `sub`). */
	viewerId?: string;
	/** The detail page opens the discussion right away. */
	defaultShowComments?: boolean;
	/** Where to go once the owner Deletes the Poll; without it the card just leaves the list. */
	deletedHref?: string;
}

/** Shows the Ballot until the Poll Ends, then the Results. Whether the viewer voted doesn't matter. */
export function PollCard({
	poll: initialPoll,
	viewerId,
	defaultShowComments = false,
	deletedHref,
}: PollCardProps) {
	const { currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const router = useRouter();
	const [poll, setPoll] = useState(initialPoll);
	const [isDeleted, setIsDeleted] = useState(false);
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

	const handlePollEnded = useCallback(
		(ended?: Poll) => (ended ? setPoll(ended) : refetch()),
		[refetch]
	);
	const ballot = useBallot(poll, { isAuthed, onPollEnded: handlePollEnded });
	const status = derivePollStatus(poll);
	const { id, title, description, creatorId, creatorUsername, createdAt } = poll;
	const isOwner = !!viewerId && viewerId === creatorId;
	const canSeeVoters =
		poll.voterVisibility === 'signed-in' ? isAuthed : poll.voterVisibility === 'owner' && isOwner;
	const voters = useVoters(id, isAuthed ? (viewerId ?? 'signed-in') : 'guest');
	const [votersOption, setVotersOption] = useState<ResultRow | null>(null);
	const showVoters = (row: ResultRow) => {
		setVotersOption(row);
		voters.load(row);
	};

	const handleDeleted = () => {
		if (deletedHref) router.replace(deletedHref);
		else setIsDeleted(true);
	};
	if (isDeleted) return null;

	const ownerActions = isOwner && getOwnerActions(poll, status).any && (
		<OwnerActions
			poll={poll}
			status={status}
			onChanged={refetch}
			onInviteeCount={(count) => setPoll((current) => ({ ...current, inviteeCount: count }))}
			onDeleted={handleDeleted}
		/>
	);

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
						<AudienceLabel audience={poll.audience} />
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
							<Results
								poll={poll}
								myOptionId={ballot.myOptionId}
								turnout={ballot.turnout}
								onSealed={refetch}
								onSelectOption={canSeeVoters ? showVoters : undefined}
							/>
						) : (
							<Ballot
								poll={poll}
								status={status}
								ballot={ballot}
								requireAuth={requireAuth}
							/>
						)}
					</motion.div>
				</AnimatePresence>

				{/* One fixed place, so a status change never remounts an open owner dialog */}
				{ownerActions && <div className="flex justify-end">{ownerActions}</div>}
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

			{canSeeVoters && (
				<VotersDialog option={votersOption} voters={voters} onClose={() => setVotersOption(null)} />
			)}

			{authDialog.open && <AuthDialog {...authDialog} />}
		</article>
	);
}
