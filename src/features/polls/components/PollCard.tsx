'use client';

import { AnimatePresence, m } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserChip } from '@/features/profiles/UserChip';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { cn } from '@/lib/utils';

import { formatAge } from '../format';
import { useBallot } from '../hooks/useBallot';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useViewerClock } from '../hooks/useViewerClock';
import type { Poll } from '../schema';
import { bookmarkPoll, getPoll, unbookmarkPoll } from '../service';
import { derivePollStatus } from '../status';
import { Ballot } from './Ballot';
import { VotedPill } from './BallotMotion';
import { getOwnerActions, OwnerActions } from './OwnerActions';
import { PollFooter } from './PollFooter';
import { ReportCommentDialog } from './ReportCommentDialog';
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
	 * Set on the poll page: the title is plain text and Comments leads to the discussion below.
	 * Feed cards link both to the page instead.
	 */
	isPage?: boolean;
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
	isPage = false,
	deletedHref,
	headingLevel: Heading = 'h2',
}: PollCardProps) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	const router = useRouter();
	const [poll, setPoll] = useState(initialPoll);
	const [isDeleted, setIsDeleted] = useState(false);
	const { isAuthed, requireAuth, authDialog } = useRequireAuth(!!viewerId);

	const refetch = useCallback(async () => {
		const fresh = await getPoll(poll.id).catch(() => null);
		if (fresh) setPoll(fresh);
	}, [poll.id]);

	const [isReporting, setIsReporting] = useState(false);
	const [isBookmarking, setIsBookmarking] = useState(false);
	const toggleBookmark = () =>
		requireAuth(async () => {
			if (isBookmarking) return;
			const next = !poll.bookmarked;
			setPoll((current) => ({ ...current, bookmarked: next }));
			setIsBookmarking(true);
			const result = await settle(next ? bookmarkPoll(poll.id) : unbookmarkPoll(poll.id));
			setIsBookmarking(false);
			if (result.ok) return;
			setPoll((current) => ({ ...current, bookmarked: !next }));
			toast.error(apiErrorText(t, result, next ? 'poll.bookmarkFailed' : 'poll.unbookmarkFailed'));
		});

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
		// In a list the title's link stretches over the card; the controls sit above it (z-10)
		<article className={cn('group bg-card border border-border rounded-2xl', !isPage && 'relative')}>
			<div className="flex flex-col gap-4 p-5 md:gap-5 md:px-8 md:pt-7 md:pb-7">
				<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
					<div className="flex min-w-0 items-center gap-2.5 text-[14px] text-muted-foreground">
						<UserChip
							username={creatorUsername}
							avatarUrl={poll.creatorAvatarUrl}
							label={`@${creatorUsername}`}
							// 44px tall hit area without growing the header row
							className="relative z-10 -my-2.5 min-h-11 gap-2.5 font-medium text-foreground transition-colors hover:text-muted-foreground"
							avatarClassName="size-7"
						/>
						{/* The age needs the viewer's clock; the line holds its height until then */}
						<time dateTime={createdAt} className="shrink-0 whitespace-nowrap">
							{clock ? `· ${formatAge(createdAt, clock.language, clock.now)}` : '\u00a0'}
						</time>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<AnimatePresence initial={false}>
							{status !== 'ended' && ballot.myOptionId && <VotedPill key="voted" label={t('poll.votedPill')} />}
						</AnimatePresence>
						<StatusChip status={status} poll={poll} time="inline" onCard />
					</div>
				</div>

				<div>
					{/* On the poll page the title is plain, selectable text; in a list it leads to the page */}
					{isPage ? (
						<Heading className="poll-title wrap-anywhere text-foreground select-text md:text-[25px]">
							{title}
						</Heading>
					) : (
						<Link href={`/poll/${id}`} className="after:absolute after:inset-0 after:rounded-2xl">
							<Heading className="poll-title wrap-anywhere text-foreground hover:text-muted-foreground transition-colors md:text-[25px]">
								{title}
							</Heading>
						</Link>
					)}
					{description && (
						<p className="mt-2 max-w-[65ch] wrap-anywhere text-base text-muted-foreground leading-normal">
							{description}
						</p>
					)}
				</div>

				{/* When a Poll ends while open on screen, the Ballot gives way to the Results */}
				<AnimatePresence mode="wait" initial={false}>
					<m.div
						key={status === 'ended' ? 'results' : 'ballot'}
						className="relative z-10"
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
				{ownerActions && <div className="relative z-10 flex justify-end">{ownerActions}</div>}
			</div>

			<div className="relative z-10">
				<PollFooter
					pollId={id}
					title={title}
					turnout={ballot.turnout}
					audience={poll.audience}
					commentCount={poll.commentCount}
					isPage={isPage}
					bookmarked={!!poll.bookmarked}
					onToggleBookmark={toggleBookmark}
					onReport={isOwner ? undefined : () => requireAuth(() => setIsReporting(true))}
				/>
			</div>

			{isReporting && <ReportCommentDialog pollId={id} open onOpenChange={setIsReporting} />}

			{canSeeVoters && (
				<VotersDialog option={votersOption} voters={voters} onClose={() => setVotersOption(null)} />
			)}

			{authDialog.open && <AuthDialog {...authDialog} />}
		</article>
	);
}
