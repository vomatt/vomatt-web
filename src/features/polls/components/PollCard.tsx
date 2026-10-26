'use client';

import { AnimatePresence, m } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserChip } from '@/features/profiles/UserChip';
import { useHydrated } from '@/hooks/useHydrated';

import { formatFromNow } from '../format';
import { useBallot } from '../hooks/useBallot';
import { useComments } from '../hooks/useComments';
import { useRequireAuth } from '../hooks/useRequireAuth';
import type { Poll } from '../schema';
import { getPoll } from '../service';
import { derivePollStatus } from '../status';
import { AudienceLabel } from './AudienceLabel';
import { Ballot } from './Ballot';
import { CommentThread, useCommentLink } from './CommentThread';
import { getOwnerActions, OwnerActions } from './OwnerActions';
import { PollFooter } from './PollFooter';
import { type ResultRow, Results } from './Results';
import { StatusChip } from './StatusChip';
import { useVoters, VotersDialog } from './VoterList';

interface PollCardProps {
	poll: Poll;
	/** The signed-in viewer's user id (the session `sub`). */
	viewerId?: string;
	/** The viewer's `anonymousBallotByDefault`, which a first vote starts from. */
	anonymousByDefault?: boolean;
	/**
	 * Set on the poll page: the discussion opens right away and folds, and the title is plain text.
	 * Feed cards link the title and the comments button to the page instead.
	 */
	defaultShowComments?: boolean;
	/** Where to go once the owner Deletes the Poll; without it the card just leaves the list. */
	deletedHref?: string;
	/** h1 when the card is the page (poll detail); h2 in a list under the page's h1. */
	headingLevel?: 'h1' | 'h2';
}

/** Shows the Ballot until the Poll Ends, then the Results. Whether the viewer voted doesn't matter. */
export function PollCard({
	poll: initialPoll,
	viewerId,
	anonymousByDefault,
	defaultShowComments = false,
	deletedHref,
	headingLevel: Heading = 'h2',
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
	useCommentLink(thread);

	const refetch = useCallback(async () => {
		const fresh = await getPoll(poll.id).catch(() => null);
		if (fresh) setPoll(fresh);
	}, [poll.id]);

	const handlePollEnded = useCallback(
		(ended?: Poll) => (ended ? setPoll(ended) : refetch()),
		[refetch]
	);
	const ballot = useBallot(poll, { isAuthed, anonymousByDefault, onPollEnded: handlePollEnded });
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
		<article className="group bg-card border border-border rounded-2xl">
			<div className="p-4 space-y-4 md:p-6">
				<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
					<div className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
						<UserChip
							username={creatorUsername}
							avatarUrl={poll.creatorAvatarUrl}
							// 44px tall hit area without growing the header row
							className="-my-2.5 min-h-11 font-medium hover:text-foreground transition-colors"
							avatarClassName="size-6"
						/>
						<time dateTime={createdAt} className="shrink-0 whitespace-nowrap">
							{isHydrated && formatFromNow(createdAt, currentLanguage)}
						</time>
						<AudienceLabel audience={poll.audience} />
					</div>
					<StatusChip status={status} poll={poll} time="inline" />
				</div>

				<div>
					{/* On the poll page the title is plain, selectable text; in a list it leads to the page */}
					{defaultShowComments ? (
						<Heading className="wrap-anywhere text-[21px] font-medium leading-tight tracking-[-0.02em] text-foreground select-text md:text-[25px]">
							{title}
						</Heading>
					) : (
						<Link href={`/poll/${id}`}>
							<Heading className="wrap-anywhere text-[21px] font-medium leading-tight tracking-[-0.02em] text-foreground hover:text-muted-foreground transition-colors md:text-[25px]">
								{title}
							</Heading>
						</Link>
					)}
					{description && (
						<p className="mt-2 max-w-[65ch] wrap-anywhere text-base text-muted-foreground leading-relaxed">
							{description}
						</p>
					)}
				</div>

				{/* When a Poll ends while open on screen, the Ballot gives way to the Results */}
				<AnimatePresence mode="wait" initial={false}>
					<m.div
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
					</m.div>
				</AnimatePresence>

				{/* One fixed place, so a status change never remounts an open owner dialog */}
				{ownerActions && <div className="flex justify-end">{ownerActions}</div>}
			</div>

			<PollFooter
				pollId={id}
				title={title}
				turnout={ballot.turnout}
				commentCount={thread.total}
				onToggleComments={defaultShowComments ? () => setShowComments((value) => !value) : undefined}
			/>

			{showComments && (
				<CommentThread thread={thread} pollId={id} viewerId={viewerId} requireAuth={requireAuth} />
			)}

			{canSeeVoters && (
				<VotersDialog option={votersOption} voters={voters} onClose={() => setVotersOption(null)} />
			)}

			{authDialog.open && <AuthDialog {...authDialog} />}
		</article>
	);
}
