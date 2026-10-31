'use client';

import { m, useAnimate } from 'motion/react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Check, Eye, EyeOff, Lock } from '@/components/ui/SvgIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow } from '../format';
import type { BallotState } from '../hooks/useBallot';
import type { Poll } from '../schema';
import { type PollStatus, visibilityLevel } from '../status';
import { BallotBoxIcon, BallotMark, SelectionHighlight } from './BallotMotion';
import { Seal } from './Seal';

type BallotProps = {
	poll: Poll;
	status: Exclude<PollStatus, 'ended'>;
	ballot: BallotState;
	requireAuth: (action: () => void) => void;
	/** The id of the card's title, which names the options. */
	titleId: string;
};

/** What the viewer is doing with a cast Ballot. Without a Ballot the card shows the Vote row instead. */
type SealedMode =
	/** The Seal in full, right after a cast here */
	| { kind: 'moment' }
	/** The Seal folded to a row, on later visits */
	| { kind: 'row' }
	/** Choosing an option to replace `from` */
	| { kind: 'updating'; from: string }
	| { kind: 'withdrawing' };

/** Card states A (no Ballot), B (has Ballot) and C (Scheduled). Never shows counts. */
export function Ballot({ poll, status, ballot, requireAuth, titleId }: BallotProps) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [mode, setMode] = useState<SealedMode>({ kind: 'row' });
	// Read out once a cast is saved, from a live region that is always mounted
	const [announcement, setAnnouncement] = useState('');
	const { myOptionId, selected, setSelected, anonymous, setAnonymous, isPending, pendingAction } = ballot;
	const isScheduled = status === 'scheduled';
	// A first vote in flight already has a Ballot; its Vote button stays (busy) until it is in
	const view = isScheduled ? 'scheduled' : !myOptionId || pendingAction === 'vote' ? 'vote' : mode.kind;
	// One id per Ballot, not per Poll: the feed card and the Poll page each have a Ballot for the same Poll,
	// and a shared layoutId flies the highlight from one to the other on navigation
	const highlightId = useId();
	// Nobody sees the voter list on a 'nobody' Poll, so there is nothing to hide from
	const canHideName = !isScheduled && anonymous !== null && poll.voterVisibility !== 'nobody';

	const [optionsRef, animateOptions] = useAnimate<HTMLFieldSetElement>();
	/** The options recoil when a request is rolled back. */
	const shake = () =>
		animateOptions(optionsRef.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4 });

	const choose = (optionId: string) => {
		setSelected(optionId);
		// Picking another option after voting starts replacing the vote
		if (myOptionId && optionId !== myOptionId && mode.kind !== 'updating') {
			setMode({ kind: 'updating', from: myOptionId });
		}
	};

	const startUpdate = () => {
		if (!myOptionId) return;
		setMode({ kind: 'updating', from: myOptionId });
		// The button goes away, so keyboard focus moves to the options to pick from
		optionsRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
	};

	const cancelUpdate = () => {
		setSelected(myOptionId);
		setMode({ kind: 'row' });
	};

	const castSelected = () => {
		if (!selected) return;
		requireAuth(async () => {
			// A small tap on phones, like the ballot hitting the bottom of the box
			navigator.vibrate?.(12);
			const outcome = await ballot.cast(selected);
			if (outcome === 'saved') {
				setMode({ kind: 'moment' });
				setAnnouncement(t('poll.voteCast'));
			} else if (outcome === 'failed') {
				shake();
			}
		});
	};

	const withdraw = async () => {
		setMode({ kind: 'row' });
		setAnnouncement('');
		const outcome = await ballot.retract();
		if (outcome === 'saved') setAnnouncement(t('poll.voteWithdrawn'));
		else if (outcome === 'failed') shake();
	};

	const sealActions = (
		<>
			<Button
				size="md"
				variant="ghost"
				className="text-tide-foreground hover:text-tide-foreground"
				disabled={isPending}
				onClick={() => setMode({ kind: 'withdrawing' })}
			>
				{t('poll.withdrawVote')}
			</Button>
			<Button size="md" variant="outline" disabled={isPending} onClick={startUpdate}>
				{t('poll.updateVote')}
			</Button>
		</>
	);

	let actions: React.ReactNode;
	if (view === 'scheduled') {
		actions = (
			<p className="flex min-h-11 items-center text-body-4 text-muted-foreground">
				{isHydrated && t('poll.opensHint', { distance: formatFromNow(poll.startTime, currentLanguage) })}
			</p>
		);
	} else if (view === 'vote') {
		actions = (
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
		);
	} else if (view === 'moment' || view === 'row') {
		// Once cast, the choice applies at once, so it reads as where the name stands with one action
		const nameLine = canHideName && (
			<div className="flex items-center gap-2.5 border-t border-tide-line py-1 pr-2 pl-4 text-caption-1 leading-snug">
				{anonymous ? (
					<EyeOff aria-hidden className="size-4 shrink-0 text-tide" />
				) : (
					<Eye aria-hidden className="size-4 shrink-0 text-tide" />
				)}
				<p role="status" className="min-w-0 flex-1">
					{anonymous ? t('poll.nameHidden') : t('poll.nameListed')}
				</p>
				{/* aria-disabled, not disabled: a disabled button drops keyboard focus while the request runs */}
				<Button
					size="xs"
					variant="ghost"
					aria-disabled={isPending}
					onClick={() => !isPending && setAnonymous(!anonymous)}
					className="shrink-0 text-foreground underline underline-offset-3"
				>
					{anonymous ? t('poll.showMyName') : t('poll.hideMyName')}
				</Button>
			</div>
		);
		actions = (
			<Seal variant={view} endTime={poll.endTime} footer={nameLine}>
				{sealActions}
			</Seal>
		);
	} else if (mode.kind === 'updating') {
		const previous = poll.options.find((option) => option.id === mode.from)?.text ?? '';
		actions = (
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
				<p className="flex min-w-0 items-center gap-2.5 text-body-4 leading-5 text-muted-foreground">
					<RefreshIcon className="size-[18px] shrink-0 text-input" />
					{t('poll.updatingHint', { option: previous })}
				</p>
				<div className="ml-auto flex shrink-0 items-center gap-1.5">
					<Button variant="ghost" className="text-muted-foreground" disabled={isPending} onClick={cancelUpdate}>
						{t('common.cancel')}
					</Button>
					<Button
						className="min-w-[132px]"
						disabled={isPending || !selected || selected === mode.from}
						loading={pendingAction === 'update'}
						loadingIcon={<BallotBoxIcon className="size-4" />}
						onClick={castSelected}
					>
						{t('poll.updateVote')}
					</Button>
				</div>
			</div>
		);
	} else {
		actions = (
			<div
				role="group"
				aria-labelledby={`withdraw-${poll.id}`}
				className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface-soft py-3.5 pr-3.5 pl-5"
			>
				<div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
					<p id={`withdraw-${poll.id}`} className="text-body-4 font-medium leading-5 text-foreground">
						{t('poll.withdrawTitle')}
					</p>
					<p className="text-caption-1 leading-snug text-muted-foreground">{t('poll.withdrawBody')}</p>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					{/* Withdraw vote went away under the pointer; the safe answer takes the focus */}
					<Button size="md" variant="outline" autoFocus onClick={() => setMode({ kind: 'row' })}>
						{t('poll.keep')}
					</Button>
					<Button size="md" variant="destructive" onClick={withdraw}>
						{t('poll.withdraw')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 md:gap-5">
			<fieldset
				ref={optionsRef}
				disabled={isScheduled || isPending}
				aria-labelledby={titleId}
				className="isolate space-y-2.5"
			>
				{poll.options.map((option) => {
					const isSelected = selected === option.id;
					return (
						<label
							key={option.id}
							className={cn(
								'relative flex min-h-14 cursor-pointer items-center gap-3.5 rounded-xl border border-border bg-card px-5 py-2.5 text-body-2 font-medium transition-colors',
								'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
								// Raised so the highlight slides over the other options, not under the ones after it
								isSelected ? 'z-10 border-transparent' : 'hover:border-border-strong',
								isScheduled && 'cursor-not-allowed text-muted-foreground'
							)}
						>
							{isSelected && <SelectionHighlight layoutId={highlightId} inTransit={isPending} />}
							<input
								type="radio"
								name={`ballot-${poll.id}`}
								value={option.id}
								checked={isSelected}
								onChange={() => choose(option.id)}
								className="peer sr-only"
							/>
							<BallotMark state={isSelected ? 'selected' : 'rest'} />
							<span className="relative min-w-0 flex-1 wrap-anywhere">{option.text}</span>
						</label>
					);
				})}
			</fieldset>

			{/* Before a vote the choice only rides along with it, so a checkbox, not a switch that acts at once */}
			{canHideName && view === 'vote' && (
				// Both lines, the label and who sees voters, are the touch target
				<label className="flex min-h-11 cursor-pointer items-start gap-2.5 self-start py-0.5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
					<input
						type="checkbox"
						checked={anonymous}
						disabled={isPending}
						onChange={(event) => setAnonymous(event.target.checked)}
						aria-labelledby={`anonymous-${poll.id}-label`}
						aria-describedby={`anonymous-${poll.id}-help`}
						className="peer sr-only"
					/>
					<span
						aria-hidden
						className={cn(
							'grid size-5 shrink-0 place-items-center rounded-md transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
							anonymous ? 'bg-primary text-highlight' : 'border-[1.5px] border-input bg-card'
						)}
					>
						{anonymous && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
					</span>
					<span className="flex min-w-0 flex-col gap-0.5">
						<span id={`anonymous-${poll.id}-label`} className="text-body-4 font-medium leading-5 text-foreground">
							{t('poll.anonymousToggle')}
						</span>
						<span id={`anonymous-${poll.id}-help`} className="text-caption-1 leading-snug text-muted-foreground">
							{anonymous ? t('poll.anonymousHidden') : t(`poll.visibility.${visibilityLevel(poll)}`)}
						</span>
					</span>
				</label>
			)}

			<div className="border-t border-border pt-4 md:pt-5">
				{/* Each mode fades in as it takes over; the first render, from the server, stays still */}
				<m.div
					key={view}
					initial={isHydrated ? { opacity: 0, y: 4 } : false}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2, ease: 'easeOut' }}
				>
					{actions}
				</m.div>
			</div>
			<p role="status" aria-live="polite" className="sr-only">
				{announcement}
			</p>
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
