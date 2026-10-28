'use client';

import { m, useAnimate } from 'motion/react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Lock } from '@/components/ui/SvgIcons';
import { Switch } from '@/components/ui/Switch';
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
export function Ballot({ poll, status, ballot, requireAuth }: BallotProps) {
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
				setAnnouncement(t('poll.sealedTitle'));
			} else if (outcome === 'failed') {
				shake();
			}
		});
	};

	const withdraw = async () => {
		setMode({ kind: 'row' });
		setAnnouncement('');
		if ((await ballot.retract()) === 'failed') shake();
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
			<p className="flex min-h-11 items-center text-[14px] text-muted-foreground">
				{isHydrated && t('poll.opensHint', { distance: formatFromNow(poll.startTime, currentLanguage) })}
			</p>
		);
	} else if (view === 'vote') {
		actions = (
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
				<p className="flex min-w-0 items-center gap-2.5 text-[14px] leading-5 text-tide-foreground">
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
		actions = (
			<Seal variant={view} endTime={poll.endTime}>
				{sealActions}
			</Seal>
		);
	} else if (mode.kind === 'updating') {
		const previous = poll.options.find((option) => option.id === mode.from)?.text ?? '';
		actions = (
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
				<p className="flex min-w-0 items-center gap-2.5 text-[14px] leading-5 text-muted-foreground">
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
					<p id={`withdraw-${poll.id}`} className="text-[14px] font-medium leading-5 text-foreground">
						{t('poll.withdrawTitle')}
					</p>
					<p className="text-[13px] leading-[18px] text-muted-foreground">{t('poll.withdrawBody')}</p>
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
			<fieldset ref={optionsRef} disabled={isScheduled || isPending} className="isolate space-y-2.5">
				<legend className="sr-only">{poll.title}</legend>
				{poll.options.map((option) => {
					const isSelected = selected === option.id;
					return (
						<label
							key={option.id}
							className={cn(
								'relative flex min-h-14 cursor-pointer items-center gap-3.5 rounded-xl border border-border bg-card px-5 py-2.5 text-[16px] font-medium transition-colors',
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

			{/* Nobody sees the voter list on a 'nobody' Poll, so there is nothing to hide from */}
			{!isScheduled && anonymous !== null && poll.voterVisibility !== 'nobody' && (
				<div className="flex items-start justify-between gap-6">
					{/* Both lines, the label and who sees voters, are the touch target */}
					<label
						htmlFor={`anonymous-${poll.id}`}
						className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col justify-center gap-1"
					>
						<span id={`anonymous-${poll.id}-label`} className="text-[14px] font-medium leading-5 text-foreground">
							{t('poll.anonymousToggle')}
						</span>
						<span id={`anonymous-${poll.id}-help`} className="text-[13px] leading-[18px] text-muted-foreground">
							{t(`poll.visibility.${visibilityLevel(poll)}`)}
						</span>
					</label>
					<Switch
						id={`anonymous-${poll.id}`}
						aria-labelledby={`anonymous-${poll.id}-label`}
						aria-describedby={`anonymous-${poll.id}-help`}
						checked={anonymous}
						disabled={isPending}
						onCheckedChange={setAnonymous}
					/>
				</div>
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
