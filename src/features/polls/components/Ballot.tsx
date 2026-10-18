'use client';

import { AnimatePresence, m, useAnimate } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow, formatPollDate } from '../format';
import type { BallotState } from '../hooks/useBallot';
import type { Poll } from '../schema';
import { type PollStatus, visibilityLevel } from '../status';
import { BallotBoxIcon, BallotMark, SelectionHighlight, VotedStamp } from './BallotMotion';

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
	const { myOptionId, selected, setSelected, anonymous, setAnonymous, isPending, pendingAction } = ballot;
	const isScheduled = status === 'scheduled';
	const hasBallot = myOptionId !== null;
	// The Ballot shows at once, but the Vote button stays (busy) until the first vote is in
	const showsVoteAction = !hasBallot || pendingAction === 'vote';
	const level = visibilityLevel(poll);
	const visibilityHint = level && t(`poll.visibility.${level}`);

	const [optionsRef, animateOptions] = useAnimate();
	/** The options recoil when a request is rolled back. */
	const shake = () =>
		animateOptions(optionsRef.current, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4 });

	const castSelected = () => {
		if (!selected) return;
		requireAuth(async () => {
			// A small tap on phones, like the ballot hitting the bottom of the box
			navigator.vibrate?.(12);
			const outcome = await ballot.cast(selected);
			if (outcome === 'saved') {
				toast.success(t('poll.voteCast'));
			} else if (outcome === 'failed') {
				shake();
			}
		});
	};

	const withdraw = async () => {
		setConfirmingWithdraw(false);
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
				<span className="text-[13px]">{t('poll.withdrawConfirm')}</span>
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
				<Button
					size="sm"
					variant="ghost"
					className="text-muted-foreground"
					disabled={isPending}
					onClick={() => setConfirmingWithdraw(true)}
				>
					{t('poll.withdrawVote')}
				</Button>
				<Button
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
				<span className="text-[13px] text-muted-foreground">{t('poll.revealHint')}</span>
				<Button
					disabled={isPending || !selected}
					loading={pendingAction === 'vote'}
					loadingIcon={<BallotBoxIcon className="size-4" />}
					onClick={castSelected}
					className="w-full transition-transform active:scale-95 sm:w-auto sm:min-w-32"
				>
					{t('poll.vote')}
				</Button>
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
					return (
						<label
							key={option.id}
							className={cn(
								'relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-base transition-colors',
								'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
								isSelected ? 'border-transparent font-medium' : 'hover:border-border-strong',
								((hasBallot && !isSelected) || isScheduled) && 'text-muted-foreground',
								isScheduled && 'cursor-not-allowed'
							)}
						>
							{isSelected && (
								<SelectionHighlight layoutId={`ballot-${poll.id}`} inTransit={isPending} />
							)}
							<input
								type="radio"
								name={`ballot-${poll.id}`}
								value={option.id}
								checked={isSelected}
								onChange={() => setSelected(option.id)}
								className="peer sr-only"
							/>
							<BallotMark checked={isSelected} />
							<span className="relative min-w-0 flex-1 wrap-anywhere">{option.text}</span>
							<AnimatePresence>
								{isMine && (
									<span key="stamp" className="relative" title={t('poll.yourVote')}>
										<VotedStamp label={t('poll.stamp')} />
										<span className="sr-only">{t('poll.yourVote')}</span>
									</span>
								)}
							</AnimatePresence>
						</label>
					);
				})}
			</fieldset>

			{/* Nobody sees the voter list on a 'nobody' Poll, so there is nothing to hide from */}
			{hasBallot && anonymous !== null && poll.voterVisibility !== 'nobody' && (
				<div className="flex items-center justify-between gap-3">
					{/* The whole row is the 44px touch target; the Switch alone is smaller */}
					<label
						htmlFor={`anonymous-${poll.id}`}
						className="flex min-h-11 flex-1 cursor-pointer items-center text-[13px] text-muted-foreground"
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

			{!hasBallot && !isScheduled && visibilityHint && (
				<p className="text-[13px] text-muted-foreground">{visibilityHint}</p>
			)}

			<AnimatePresence initial={false}>
				{hasBallot && poll.endTime && isHydrated && (
					<m.div
						key="sealed"
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
						transition={{ duration: 0.25, ease: 'easeOut' }}
						className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-soft px-3.5 py-3 text-[13px] text-muted-foreground"
					>
						<BallotBoxIcon className="mt-0.5 shrink-0 text-foreground" />
						<div className="flex flex-col gap-1">
							<p>{t('poll.sealed', { date: formatPollDate(poll.endTime, currentLanguage) })}</p>
							{visibilityHint && <p>{visibilityHint}</p>}
						</div>
					</m.div>
				)}
			</AnimatePresence>

			<div
				role={confirmingWithdraw ? 'group' : undefined}
				aria-label={confirmingWithdraw ? t('poll.withdrawVote') : undefined}
				className="flex flex-wrap items-center justify-between gap-2.5"
			>
				{actions}
			</div>
		</div>
	);
}
