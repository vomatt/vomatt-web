'use client';

import { AnimatePresence, m, useAnimate } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Lock } from '@/components/ui/SvgIcons';
import { Switch } from '@/components/ui/Switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow, formatPollMoment } from '../format';
import type { BallotState } from '../hooks/useBallot';
import { useViewerClock } from '../hooks/useViewerClock';
import type { Poll } from '../schema';
import { type PollStatus, visibilityLevel } from '../status';
import { BallotBoxIcon, BallotMark, SelectionHighlight, YourVotePill } from './BallotMotion';
import { Seal } from './Seal';

type BallotProps = {
	poll: Poll;
	status: Exclude<PollStatus, 'ended'>;
	ballot: BallotState;
	requireAuth: (action: () => void) => void;
};

/** Card states A (no Ballot), B (has Ballot) and C (Scheduled). Never shows counts. */
export function Ballot({ poll, status, ballot, requireAuth }: BallotProps) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
	// The Seal shows in full once per cast, then folds to a row on later visits
	const [justSealed, setJustSealed] = useState(false);
	// Read out once a cast is saved, from a live region that is always mounted
	const [announcement, setAnnouncement] = useState('');
	const { myOptionId, selected, setSelected, anonymous, setAnonymous, isPending, pendingAction } = ballot;
	const isScheduled = status === 'scheduled';
	const hasBallot = myOptionId !== null;
	// The Ballot shows at once, but the Vote button stays (busy) until the first vote is in
	const showsVoteAction = !hasBallot || pendingAction === 'vote';
	const isVoteRow = !isScheduled && !confirmingWithdraw && showsVoteAction;

	const [optionsRef, animateOptions] = useAnimate();
	/** The options recoil when a request is rolled back. */
	const shake = () =>
		animateOptions(optionsRef.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4 });

	const castSelected = () => {
		if (!selected) return;
		requireAuth(async () => {
			// A small tap on phones, like the ballot hitting the bottom of the box
			navigator.vibrate?.(12);
			// The Ballot shows as cast at once, so the Seal opens with it instead of after a row
			const wasSealed = justSealed;
			setJustSealed(true);
			const outcome = await ballot.cast(selected);
			if (outcome === 'saved') {
				setAnnouncement(t('poll.sealedTitle'));
			} else {
				setJustSealed(wasSealed);
				if (outcome === 'failed') shake();
			}
		});
	};

	const withdraw = async () => {
		setConfirmingWithdraw(false);
		setJustSealed(false);
		setAnnouncement('');
		if ((await ballot.retract()) === 'failed') shake();
	};

	let actions: React.ReactNode;
	if (isScheduled) {
		actions = (
			<>
				<span className="text-xs text-muted-foreground">
					{isHydrated &&
						t('poll.opensHint', { distance: formatFromNow(poll.startTime, currentLanguage) })}
				</span>
			</>
		);
	} else if (confirmingWithdraw) {
		actions = (
			<>
				<span className="text-[12px]">{t('poll.withdrawConfirm')}</span>
				<div className="flex gap-1.5">
					<Button size="sm" variant="ghost" onClick={() => setConfirmingWithdraw(false)}>
						{t('poll.keep')}
					</Button>
					<Button size="sm" variant="destructive" onClick={withdraw}>
						{t('poll.withdraw')}
					</Button>
				</div>
			</>
		);
	} else if (!showsVoteAction) {
		actions = (
			<>
				{/* Keyed so React mounts new buttons instead of fading the Vote button's fill into these */}
				<Button
					key="withdraw"
					size="sm"
					variant="ghost"
					className="text-muted-foreground"
					disabled={isPending}
					onClick={() => setConfirmingWithdraw(true)}
				>
					{t('poll.withdrawVote')}
				</Button>
				<Button
					key="update"
					size="sm"
					variant="outline"
					disabled={isPending || !selected || selected === myOptionId}
					loading={pendingAction === 'update'}
					loadingIcon={<BallotBoxIcon className="size-4" />}
					onClick={castSelected}
				>
					{t('poll.updateVote')}
				</Button>
			</>
		);
	} else {
		actions = (
			<>
				<Button
					key="vote"
					disabled={isPending || !selected}
					loading={pendingAction === 'vote'}
					loadingIcon={<BallotBoxIcon className="size-4" />}
					onClick={castSelected}
					className="transition-transform active:scale-95"
				>
					{t('poll.vote')}
				</Button>
				{/* Once cast, the Seal keeps this promise instead */}
				{!hasBallot && <SealedUntilLine poll={poll} />}
			</>
		);
	}

	return (
		<div className="space-y-3.5">
			<fieldset ref={optionsRef} disabled={isScheduled || isPending} className="space-y-2">
				<legend className="sr-only">{poll.title}</legend>
				{poll.options.map((option) => {
					const isSelected = selected === option.id;
					const isMine = myOptionId === option.id;
					const isCast = isMine && isSelected;
					// Once a vote is cast, the other options step back
					const quiet = hasBallot && !isSelected;
					return (
						<label
							key={option.id}
							className={cn(
								'relative flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-[15px] transition-colors',
								'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
								isSelected ? 'border-transparent font-medium' : 'hover:border-border-strong',
								quiet && 'min-h-11',
								(quiet || isScheduled) && 'text-muted-foreground',
								isScheduled && 'cursor-not-allowed'
							)}
						>
							{isSelected && (
								<SelectionHighlight layoutId={`ballot-${poll.id}`} inTransit={isPending} cast={isCast} />
							)}
							<input
								type="radio"
								name={`ballot-${poll.id}`}
								value={option.id}
								checked={isSelected}
								onChange={() => setSelected(option.id)}
								className="peer sr-only"
							/>
							<BallotMark state={isCast ? 'cast' : isSelected ? 'selected' : 'rest'} quiet={quiet} />
							<span className="relative min-w-0 flex-1 wrap-anywhere">{option.text}</span>
							<AnimatePresence>
								{isMine && <YourVotePill key="mine" label={t('poll.yourVoteShort')} />}
							</AnimatePresence>
						</label>
					);
				})}
			</fieldset>

			{/* Nobody sees the voter list on a 'nobody' Poll, so there is nothing to hide from */}
			{!isScheduled && anonymous !== null && poll.voterVisibility !== 'nobody' && (
				<div className="flex items-center justify-between gap-3">
					{/* The whole row, label included, is the 44px touch target */}
					<label
						htmlFor={`anonymous-${poll.id}`}
						className="flex min-h-11 flex-1 cursor-pointer items-center text-[12px] text-muted-foreground"
					>
						{t('poll.anonymousToggle')}
					</label>
					<Switch
						id={`anonymous-${poll.id}`}
						checked={anonymous}
						disabled={isPending}
						onCheckedChange={setAnonymous}
					/>
				</div>
			)}

			{/* After voting, the Seal that keeps the promise the Vote row made */}
			<AnimatePresence initial={false}>
				{!isScheduled && hasBallot && (
					<m.div
						key="seal"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
						transition={{ duration: 0.2, ease: 'easeOut' }}
					>
						<Seal
							full={justSealed}
							endTime={poll.endTime}
							visibility={visibilityLevel(poll)}
							turnout={ballot.turnout}
						/>
					</m.div>
				)}
			</AnimatePresence>
			<p role="status" aria-live="polite" className="sr-only">
				{announcement}
			</p>

			<div
				role={confirmingWithdraw ? 'group' : undefined}
				aria-label={confirmingWithdraw ? t('poll.withdrawVote') : undefined}
				// As tall as the Vote button, so the smaller buttons after voting don't shrink the card
				className={cn(
					'flex min-h-11 flex-wrap items-center gap-2.5',
					isVoteRow ? 'gap-x-3' : 'justify-between'
				)}
			>
				{actions}
			</div>
		</div>
	);
}

/** Before a vote, what happens to it, in one Tide line: "Sealed until Fri 18:00 · after it ends, …". */
function SealedUntilLine({ poll }: { poll: Poll }) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	// The date needs the viewer's time zone, so a dated line holds its space until hydration
	const head = !poll.endTime
		? t('poll.sealedUntilEnd')
		: clock && t('poll.sealedUntil', { date: formatPollMoment(poll.endTime, clock.language, clock.now) });
	return (
		<p className="flex min-w-0 flex-1 basis-60 items-start gap-1.5 text-[13px] text-tide-foreground">
			<Lock aria-hidden className="mt-[3px] size-3.5 shrink-0 text-tide" />
			<span className={cn(!head && 'invisible')}>
				{head ? `${head} · ${t(`poll.visibilityShort.${visibilityLevel(poll)}`)}` : '\u00a0'}
			</span>
		</p>
	);
}
