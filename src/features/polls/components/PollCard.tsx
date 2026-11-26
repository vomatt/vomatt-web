'use client';

import { AnimatePresence, m } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AuthDialog } from '@/components/auth/AuthDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActing } from '@/features/communities/ActingProvider';
import { canReadResults } from '@/features/communities/permissions';
import { UserChip } from '@/features/profiles/UserChip';
import { apiErrorText } from '@/lib/api/error-text';
import { settle } from '@/lib/api/settle';
import { EASE_OUT_STRONG } from '@/lib/motion';
import { pollHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import { formatAge } from '../format';
import { useBallot } from '../hooks/useBallot';
import { usePollStatus } from '../hooks/usePollStatus';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useViewerClock } from '../hooks/useViewerClock';
import type { Poll } from '../schema';
import { bookmarkPoll, getPoll, likePoll, unbookmarkPoll, unlikePoll } from '../service';
import { Ballot } from './Ballot';
import { VotedPill, VotedPillSpace } from './BallotMotion';
import { getOwnerActions, OwnerActions } from './OwnerActions';
import { PollFooter } from './PollFooter';
import { ReportCommentDialog } from './ReportCommentDialog';
import { type ResultRow, Results } from './Results';
import { SealedUntilReveal } from './Seal';
import { StatusChip } from './StatusChip';
import { useVoters, VotersDialog } from './VoterList';

interface PollCardProps {
	poll: Poll;
	/** The signed-in viewer's user id (the session `sub`). */
	viewerId?: string;
	/** The viewer's `anonymousBallotByDefault`, which a first vote starts from. */
	anonymousByDefault?: boolean;
	/** On the poll page, the Discussion's count, so the two always agree. */
	commentCount?: number;
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

/**
 * Shows the Ballot until the Poll Ends, then the Results, or the Seal until its `revealAt`.
 * Whether the viewer voted doesn't matter.
 */
export function PollCard({
	poll: initialPoll,
	viewerId,
	anonymousByDefault,
	commentCount,
	isPage = false,
	deletedHref,
	headingLevel: Heading = 'h2',
}: PollCardProps) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	const router = useRouter();
	const [poll, setPoll] = useState(initialPoll);
	// A refreshed page (after a Comment on it) brings the new count; the card's other state stays its own
	const [prevInitialPoll, setPrevInitialPoll] = useState(initialPoll);
	if (initialPoll !== prevInitialPoll) {
		setPrevInitialPoll(initialPoll);
		setPoll((current) => ({ ...current, commentCount: initialPoll.commentCount }));
	}
	const [isDeleted, setIsDeleted] = useState(false);
	const { isAuthed, requireAuth, authDialog } = useRequireAuth(!!viewerId);
	const { acting } = useActing();

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

	const isLiking = useRef(false);
	const toggleLike = () =>
		requireAuth(async () => {
			if (isLiking.current) return;
			const next = !poll.likedByMe;
			const step = next ? 1 : -1;
			setPoll((current) => ({
				...current,
				likedByMe: next,
				likeCount: Math.max(0, (current.likeCount ?? 0) + step),
			}));
			isLiking.current = true;
			const result = await settle(next ? likePoll(poll.id) : unlikePoll(poll.id));
			isLiking.current = false;
			if (result.ok) return;
			// Only undo our own change: a refetch meanwhile may already hold the server's truth
			setPoll((current) =>
				current.likedByMe !== next
					? current
					: {
							...current,
							likedByMe: !next,
							likeCount: Math.max(0, (current.likeCount ?? 0) - step),
						}
			);
			toast.error(apiErrorText(t, result, next ? 'poll.likeFailed' : 'poll.unlikeFailed'));
		});

	const handlePollEnded = useCallback(
		(ended?: Poll) => (ended ? setPoll(ended) : refetch()),
		[refetch]
	);
	const ballot = useBallot(poll, { isAuthed, anonymousByDefault, onPollEnded: handlePollEnded });
	// Ended by the clock, this copy still has the Open Poll's Turnout; Results fetch the counts
	const { status, sealedUntil } = usePollStatus(poll, refetch);
	// Results fill in only when the end or reveal happens on screen; a feed of ended Polls stays still
	const [revealedOnMount] = useState(status === 'ended' && !sealedUntil);
	const pane = sealedUntil ? 'sealed' : status === 'ended' ? 'results' : 'ballot';
	// The pane shown on mount appears still; every one after it fades in. Not AnimatePresence initial={false}, whose
	// context would also block every later mount animation inside the pane: the stamp, the Seal's pop, the ballot box
	const [paneOnMount] = useState(pane);
	const [paneChanged, setPaneChanged] = useState(false);
	if (!paneChanged && pane !== paneOnMount) setPaneChanged(true);
	const { id, title, description, creatorId, creatorUsername, createdAt } = poll;
	const isOwner = !!viewerId && viewerId === creatorId;
	const canSeeVoters =
		!sealedUntil &&
		(poll.voterVisibility === 'signed-in'
			? isAuthed
			: // An unknown role (its account list failed to load) leaves it to the API
				poll.voterVisibility === 'owner' && isOwner && (!acting?.role || canReadResults(acting.role)));
	const voters = useVoters(id, isAuthed ? (viewerId ?? 'signed-in') : 'guest');
	const [votersOption, setVotersOption] = useState<(ResultRow & { participants: number }) | null>(null);
	const showVoters = (row: ResultRow, participants: number) => {
		setVotersOption({ ...row, participants });
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
		<article className={cn('group rounded-2xl bg-card forced-colors:border', !isPage && 'relative')}>
			<div className="flex flex-col gap-4 p-5 pb-1 md:gap-5 md:px-8 md:pt-7 md:pb-1">
				{/* One row wherever the author and the status chip fit side by side; a longer name sends the chip to a row
				    of its own instead of being cut. The Voted pill shows only where the card is wide enough for it beside the status
				    chip: on a phone it would squeeze the author's name, and the chosen option and the Seal already say the vote is in.
				    Lifted whole over the title's stretched link (a query container may be its own stacking context), and
				    letting clicks through to it everywhere but the author */}
				<div className="pointer-events-none relative z-10 @container">
					<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 @md:gap-x-4">
						<div className="flex max-w-full min-w-0 items-center gap-2.5 text-body-3 text-muted-foreground">
							<UserChip
								username={creatorUsername}
								avatarUrl={poll.creatorAvatarUrl}
								// 44px tall hit area without growing the header row
								className="pointer-events-auto -my-2.5 min-h-11 gap-2.5 font-semibold text-foreground transition-colors hover:text-muted-foreground active:text-muted-foreground"
								avatarClassName="size-7"
							/>
							{/* The age needs the viewer's clock; the line holds its height until then */}
							<time dateTime={createdAt} className="shrink-0 whitespace-nowrap">
								{clock ? formatAge(createdAt, clock.language, clock.now) : '\u00a0'}
							</time>
						</div>
						{/* Reversed so the status chip keeps the right edge and the Voted pill appears to its left */}
						<div className="flex shrink-0 flex-row-reverse items-center gap-2">
							<StatusChip status={status} poll={poll} time="inline" onCard />
							{status !== 'ended' && !acting && (
								<span className="hidden *:col-start-1 *:row-start-1 @md:grid">
									<VotedPillSpace label={t('poll.votedPill')} />
									<AnimatePresence initial={false}>
										{ballot.myOptionId && <VotedPill key="voted" label={t('poll.votedPill')} />}
									</AnimatePresence>
								</span>
							)}
						</div>
					</div>
				</div>

				<div>
					{/* On the poll page the title is plain, selectable text; in a list it leads to the page */}
					{isPage ? (
						<Heading
							dir="auto"
							className="text-title-2 font-semibold tracking-title text-balance wrap-anywhere text-foreground select-text"
						>
							{title}
						</Heading>
					) : (
						<Link href={pollHref(id)} className="group/card-link after:absolute after:inset-0 after:rounded-2xl">
							<Heading
									dir="auto"
									className="text-title-2 font-semibold tracking-title text-balance wrap-anywhere text-foreground hover:text-muted-foreground group-active/card-link:text-muted-foreground transition-colors"
							>
								{title}
							</Heading>
						</Link>
					)}
					{description && (
						<p dir="auto" className="mt-2 max-w-[65ch] wrap-anywhere whitespace-pre-line text-body-3 text-muted-foreground leading-normal">
							{description}
						</p>
					)}
				</div>

				{/* When a Poll ends while open on screen, the Ballot gives way to the Results */}
				<AnimatePresence mode="wait">
					<m.div
						key={pane}
						className="relative z-10"
						initial={paneChanged ? { opacity: 0 } : false}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.12, ease: EASE_OUT_STRONG }}
					>
						{sealedUntil ? (
							<SealedUntilReveal revealAt={sealedUntil} />
						) : status === 'ended' ? (
							<Results
								poll={poll}
								myOptionId={ballot.myOptionId}
								turnout={ballot.turnout}
								onSealed={refetch}
								onSelectOption={canSeeVoters ? showVoters : undefined}
								reveal={!revealedOnMount}
							/>
						) : (
							<Ballot
								poll={poll}
								status={status}
								ballot={ballot}
								requireAuth={requireAuth}
								isOwner={isOwner}
								isActing={!!acting}
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
					commentCount={commentCount ?? poll.commentCount}
					isPage={isPage}
					bookmarked={!!poll.bookmarked}
					onToggleBookmark={toggleBookmark}
					liked={!!poll.likedByMe}
					likeCount={poll.likeCount}
					onToggleLike={toggleLike}
					onReport={isOwner ? undefined : () => requireAuth(() => setIsReporting(true))}
				/>
			</div>

			{isReporting && <ReportCommentDialog pollId={id} open onOpenChange={setIsReporting} />}

			{canSeeVoters && (
				<VotersDialog
					option={votersOption}
					voters={voters}
					myAnonymousOptionId={ballot.anonymous ? ballot.savedOptionId : null}
					onClose={() => setVotersOption(null)}
				/>
			)}

			{authDialog.open && <AuthDialog {...authDialog} />}
		</article>
	);
}
