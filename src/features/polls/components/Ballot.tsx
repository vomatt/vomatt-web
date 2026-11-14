'use client';

import { useAnimate } from 'motion/react';
import { useId, useRef, useState } from 'react';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Lock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { CommunityCantVote } from '@/features/communities/CommunityCantVote';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow } from '../format';
import type { BallotState } from '../hooks/useBallot';
import type { Poll } from '../schema';
import { type PollStatus, revealTime, visibilityLevel } from '../status';
import { BallotBoxIcon, BallotMark, SelectionHighlight } from './BallotMotion';
import { Seal } from './Seal';

type BallotProps = {
	poll: Poll;
	status: Exclude<PollStatus, 'ended'>;
	ballot: BallotState;
	requireAuth: (action: () => void) => void;
	isOwner: boolean;
	/** Acting as a community account, which never votes: the options show, but can't be picked. */
	isActing: boolean;
};

/** What the viewer is doing with a cast Ballot. Without a Ballot the card shows the Vote pane instead. */
type SealedMode = { kind: 'sealed' } | { kind: 'updating'; from: string };

/** The footer states that swap in place. They share one grid cell, so the card is as tall in each. */
const PANES = ['vote', 'sealed', 'updating'] as const;
type Pane = (typeof PANES)[number];

/** Card states A (no Ballot), B (has Ballot), C (Scheduled) and acting. Never shows counts. */
export function Ballot({
	poll,
	status,
	ballot,
	requireAuth,
	isOwner,
	isActing,
}: BallotProps) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [mode, setMode] = useState<SealedMode>({ kind: 'sealed' });
	// A dialog over the page, not a mode: the Seal stays put under it, so the card keeps its height
	const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
	// Once withdrawn, Withdraw vote is in a hidden pane, so the dialog hands focus to the options instead
	const withdrew = useRef(false);
	// Read out once a cast is saved, from a live region that is always mounted
	const [announcement, setAnnouncement] = useState('');
	// Counts casts saved here; each one pops the SealMark in
	const [casts, setCasts] = useState(0);
	const {
		myOptionId,
		savedOptionId,
		selected,
		setSelected,
		anonymous,
		setAnonymous,
		isPending,
		pendingAction,
	} = ballot;
	const isScheduled = status === 'scheduled';
	// A first vote in flight already has a Ballot; its Vote button stays (busy) until it is in
	const view = isActing
		? 'acting'
		: isScheduled
			? 'scheduled'
			: !myOptionId || pendingAction === 'vote'
				? 'vote'
				: mode.kind;
	// A pick waits on Vote or Update vote; on phones that row stays on screen until it is pressed
	const awaitsConfirm = (view === 'vote' && !!selected) || view === 'updating';
	// One id per Ballot, not per Poll: the feed card and the Poll page each have a Ballot for the same Poll,
	// and a shared layoutId flies the highlight from one to the other on navigation
	const highlightId = useId();
	// Nobody else sees the voter list on a 'nobody' Poll, or on an 'owner' one its owner votes on: nothing to hide from.
	// A community account never votes, so it has no name to hide
	const canHideName =
		!isScheduled &&
		!isActing &&
		anonymous !== null &&
		poll.voterVisibility !== 'nobody' &&
		!(isOwner && poll.voterVisibility === 'owner');

	const [optionsRef, animateOptions] = useAnimate<HTMLFieldSetElement>();
	/** The options recoil when a request is rolled back. */
	const shake = () =>
		animateOptions(
			optionsRef.current,
			{ x: [0, -6, 6, -4, 4, 0] },
			{ duration: 0.4 }
		);

	const choose = (optionId: string) => {
		setSelected(optionId);
		// Picking another option after voting starts replacing the vote
		if (myOptionId && optionId !== myOptionId && mode.kind !== 'updating') {
			setMode({ kind: 'updating', from: myOptionId });
		}
	};

	const cancelUpdate = () => {
		setSelected(myOptionId);
		setMode({ kind: 'sealed' });
	};

	const castSelected = () => {
		if (!selected) return;
		requireAuth(async () => {
			// A small tap on phones, like the ballot hitting the bottom of the box
			navigator.vibrate?.(12);
			const outcome = await ballot.cast(selected);
			if (outcome === 'saved') {
				setMode({ kind: 'sealed' });
				setCasts((count) => count + 1);
				setAnnouncement(
					t(ballot.replacedBallot() ? 'poll.voteUpdated' : 'poll.voteCast')
				);
			} else if (outcome === 'failed') {
				shake();
			}
		});
	};

	const withdraw = async () => {
		withdrew.current = true;
		setConfirmingWithdraw(false);
		setMode({ kind: 'sealed' });
		setAnnouncement('');
		const outcome = await ballot.retract();
		if (outcome === 'saved') setAnnouncement(t('poll.voteWithdrawn'));
		else if (outcome === 'failed') shake();
	};

	const sealActions = (
		<Button
			size="xs"
			variant="ghost"
			className="text-tide-foreground hover:text-tide-foreground"
			disabled={isPending}
			onClick={() => {
				withdrew.current = false;
				setConfirmingWithdraw(true);
			}}
		>
			{t('poll.withdrawVote')}
		</Button>
	);

	const opensHint = (
		<p className="flex min-h-11 items-center text-body-4 text-muted-foreground">
			{isHydrated &&
				t('poll.opensHint', {
					distance: formatFromNow(poll.startTime, currentLanguage),
				})}
		</p>
	);

	// What an Update would replace: the vote being changed, or the current one
	const replacing = mode.kind === 'updating' ? mode.from : myOptionId;
	const replacingText =
		poll.options.find((option) => option.id === replacing)?.text ?? '';
	const longestOptionText = poll.options.reduce(
		(longest, option) =>
			option.text.length > longest.length ? option.text : longest,
		''
	);

	const panes: Record<Pane, React.ReactNode> = {
		vote: (
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
					<p className="flex min-w-0 items-center gap-2.5 text-body-4 leading-5 text-tide-foreground">
						<Lock aria-hidden className="size-[18px] shrink-0 text-tide" />
						{t('poll.revealHint')}
					</p>
					<Button
						disabled={isPending || !selected}
						loading={pendingAction === 'vote'}
						loadingIcon={<BallotBoxIcon className="size-4" />}
						onClick={castSelected}
						className="ml-auto min-w-[132px] transition-transform active:scale-95"
					>
						{t('poll.vote')}
					</Button>
			</div>
		),
		sealed: (
			<Seal endTime={revealTime(poll)} popKey={casts}>
				{sealActions}
			</Seal>
		),
		updating: (
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 md:flex-nowrap">
				<p className="flex min-w-0 items-center gap-2.5 text-body-4 leading-5 text-muted-foreground">
					<RefreshIcon className="size-[18px] shrink-0 text-input" />
					{/* Sized by the longest option, in full: before a vote there is nothing to replace, so a line that
					    grew with the option would make the card taller once it is the vote */}
					<span className="grid min-w-0">
						<span className="col-start-1 row-start-1">
							{t('poll.updatingHint', { option: replacingText })}
						</span>
						<span aria-hidden className="invisible col-start-1 row-start-1">
							{t('poll.updatingHint', { option: longestOptionText })}
						</span>
					</span>
				</p>
				<div className="ml-auto flex shrink-0 items-center gap-1.5">
					<Button
						variant="ghost"
						className="text-muted-foreground"
						disabled={isPending}
						onClick={cancelUpdate}
					>
						{t('common.cancel')}
					</Button>
					<Button
						className="min-w-[132px]"
						disabled={isPending || !selected || selected === replacing}
						loading={pendingAction === 'update'}
						loadingIcon={<BallotBoxIcon className="size-4" />}
						onClick={castSelected}
					>
						{t('poll.updateVote')}
					</Button>
				</div>
			</div>
		),
	};

	return (
		<div className="flex flex-col gap-4 md:gap-5">
			{/* A form of its own keeps these radios out of any other copy's group: while the page streams in,
			    a second copy of the card can be in the document, and checking one would uncheck the other */}
			<form onSubmit={(event) => event.preventDefault()}>
				<fieldset
					ref={optionsRef}
					disabled={isScheduled || isActing || isPending}
					// A short name: the question is the heading right above, so naming the group by it reads it twice
					aria-label={t('poll.options')}
					// Takes the focus after a withdrawal, while the radios are still disabled by the request
					tabIndex={-1}
					className="isolate space-y-2.5 outline-none"
				>
					{poll.options.map((option) => {
						// The user's own vote stays in this state after switching; the community has none
						const isSelected = !isActing && selected === option.id;
						// The check waits for the cast to land, so it never shows on a vote that rolls back
						const isCast = option.id === savedOptionId;
						return (
							<label
								key={option.id}
								className={cn(
									'relative flex min-h-14 cursor-pointer items-center gap-3.5 rounded-xl border border-border bg-card px-5 py-2.5 text-body-2 font-medium transition-colors',
									'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
									// Raised so the highlight slides over the other options, not under the ones after it
									isSelected
										? 'z-10 border-transparent'
										: 'hover:border-border-strong',
									(isScheduled || isActing) &&
										'cursor-not-allowed text-muted-foreground'
								)}
							>
								{isSelected && (
									<SelectionHighlight
										layoutId={highlightId}
										inTransit={isPending}
									/>
								)}
								<input
									type="radio"
									name={`ballot-${poll.id}`}
									value={option.id}
									checked={isSelected}
									onChange={() => choose(option.id)}
									className="peer sr-only"
								/>
								<BallotMark
									state={isSelected ? (isCast ? 'voted' : 'selected') : 'rest'}
								/>
								<span className="relative min-w-0 flex-1 wrap-anywhere">
									{option.text}
								</span>
							</label>
						);
					})}
				</fieldset>
			</form>

			{view === 'acting' || view === 'scheduled' ? (
				<div className="border-t border-border pt-4 md:pt-5">
					{view === 'acting' ? (
						<div className="flex flex-col gap-3">
							{isScheduled && opensHint}
							<CommunityCantVote />
						</div>
					) : (
						opensHint
					)}
				</div>
			) : (
				// The name line rides in the sticky confirm row too: on phones it stays in view while Vote does
				<div
					className={cn(
						'flex flex-col gap-4 md:gap-5',
						awaitsConfirm && 'follow-tabbar'
					)}
				>
					{/* One line through voting, changing and withdrawing, so it never moves. It says what the vote does:
					    who sees the choice once the poll ends, or that it is counted unnamed. Before a vote the choice
					    rides along with it; after, it applies at once */}
					{canHideName && (
						<NameLine
							hidden={anonymous}
							status={
								anonymous
									? t('poll.anonymousHidden')
									: t(`poll.visibility.${visibilityLevel(poll)}`)
							}
							isPending={isPending}
							onToggle={() => setAnonymous(!anonymous)}
							className="text-muted-foreground"
						/>
					)}
					<div className="grid grid-cols-[minmax(0,1fr)]">
						{PANES.map((pane) => {
							const active = pane === view;
							return (
								<div
									key={pane}
									inert={!active}
									// Inline, so the hidden panes are hidden wherever the stylesheet isn't (tests, a failed load)
									style={{
										visibility: active ? 'visible' : 'hidden',
										opacity: active ? 1 : 0,
									}}
									// Each fills the cell, divider on top and content centered under it: the divider holds still
									// through every state, and a shorter pane splits its spare room above and below its row
									// instead of opening a gap under the line (from md, Vote sits where Withdraw vote will be)
									className="col-start-1 row-start-1 flex flex-col justify-center border-t border-border pt-4 motion-safe:transition-[opacity,visibility] motion-safe:duration-200 md:pt-5"
								>
									{panes[pane]}
								</div>
							);
						})}
					</div>
					{/* Only the phone's sticky row draws it, out of the flow; from md it would be an empty item taking a gap */}
					{awaitsConfirm && (
						<span data-sticky-fade aria-hidden className="md:hidden" />
					)}
				</div>
			)}
			<p role="status" aria-live="polite" className="sr-only">
				{announcement}
			</p>
			<AlertDialog
				open={confirmingWithdraw}
				onOpenChange={setConfirmingWithdraw}
			>
				<AlertDialogContent
					className="sm:max-w-[440px]"
					finalFocus={() => (withdrew.current ? optionsRef.current : true)}
				>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('poll.withdrawTitle')}</AlertDialogTitle>
						<AlertDialogDescription className="text-body-4">
							{t('poll.withdrawBody')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t('poll.keep')}</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={withdraw}>
							{t('poll.withdraw')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

type NameLineProps = {
	hidden: boolean;
	status: string;
	isPending: boolean;
	onToggle: () => void;
	className?: string;
};

/** Where the viewer's name stands on the voter list, with the one action that flips it. */
function NameLine({
	hidden,
	status,
	isPending,
	onToggle,
	className,
}: NameLineProps) {
	const { t } = useLanguage();
	const Icon = hidden ? EyeOff : Eye;
	return (
		<div
			className={cn(
				'flex items-center gap-2.5 text-caption-1 leading-snug text-pretty',
				className
			)}
		>
			<Icon aria-hidden className="size-4 shrink-0 text-tide" />
			<p role="status" className="min-w-0 flex-1">
				{status}
			</p>
			{/* aria-disabled, not disabled: a disabled button drops keyboard focus while the request runs */}
			<Button
				size="xs"
				variant="ghost"
				aria-disabled={isPending}
				onClick={() => !isPending && onToggle()}
				className="shrink-0 text-foreground"
			>
				{hidden ? t('poll.showMyName') : t('poll.hideMyName')}
			</Button>
		</div>
	);
}

function RefreshIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
			className={className}
		>
			<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
			<path d="M21 3v5h-5" />
			<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
			<path d="M3 21v-5h5" />
		</svg>
	);
}
