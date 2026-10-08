'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow, formatPollDate } from '../format';
import type { BallotState } from '../hooks/useBallot';
import type { Poll } from '../schema';
import type { PollStatus } from '../status';
import { BallotBoxIcon, BallotMark, SelectionHighlight, VotedStamp } from './BallotMotion';

type BallotProps = {
	poll: Poll;
	status: Exclude<PollStatus, 'ended'>;
	ballot: BallotState;
	requireAuth: (action: () => void) => void;
	/** Owner controls for a Scheduled Poll. */
	ownerActions?: React.ReactNode;
};

/** Card states A (no Ballot), B (has Ballot) and C (Scheduled). Never shows counts. */
export function Ballot({ poll, status, ballot, requireAuth, ownerActions }: BallotProps) {
	const { t, currentLanguage } = useLanguage();
	const isHydrated = useHydrated();
	const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
	const { myOptionId, selected, setSelected, isPending, failures } = ballot;
	const isScheduled = status === 'scheduled';
	const hasBallot = myOptionId !== null;

	const castSelected = () => {
		if (!selected) return;
		requireAuth(() => {
			// A small tap on phones, like the ballot hitting the bottom of the box
			navigator.vibrate?.(12);
			ballot.cast(selected);
		});
	};

	const withdraw = () => {
		setConfirmingWithdraw(false);
		ballot.retract();
	};

	let actions: React.ReactNode;
	if (isScheduled) {
		actions = (
			<>
				<span className="text-xs text-muted-foreground">
					{isHydrated &&
						t('poll.opensHint', { distance: formatFromNow(poll.startTime, currentLanguage) })}
				</span>
				{ownerActions}
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
	} else if (hasBallot) {
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
					onClick={castSelected}
				>
					{t('poll.updateVote')}
				</Button>
			</>
		);
	} else {
		actions = (
			<>
				<span className="text-xs text-muted-foreground">{t('poll.revealHint')}</span>
				<Button
					size="sm"
					disabled={isPending || !selected}
					onClick={castSelected}
					className="transition-transform active:scale-95"
				>
					{isPending && <BallotBoxIcon className="size-4" />}
					{t('poll.vote')}
				</Button>
			</>
		);
	}

	return (
		<div className="space-y-3.5">
			<motion.fieldset
				// Remounts on each rolled-back request so the shake replays
				key={failures}
				animate={failures > 0 ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
				transition={{ duration: 0.4, ease: 'easeInOut' }}
				disabled={isScheduled || isPending}
				className="space-y-1.5"
			>
				<legend className="sr-only">{poll.title}</legend>
				{poll.options.map((option) => {
					const isSelected = selected === option.id;
					const isMine = myOptionId === option.id;
					return (
						<label
							key={option.id}
							className={cn(
								'relative flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm transition-colors',
								'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
								isSelected ? 'border-transparent font-medium' : 'hover:border-primary/30',
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
							<span className="relative flex-1">{option.text}</span>
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
			</motion.fieldset>

			{!hasBallot && !isScheduled && poll.voterVisibility && (
				<p className="text-xs text-muted-foreground">
					{t(`poll.visibility.${poll.voterVisibility}`)}
				</p>
			)}

			<AnimatePresence initial={false}>
				{hasBallot && poll.endTime && isHydrated && (
					<motion.p
						key="sealed"
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
						transition={{ duration: 0.25, ease: 'easeOut' }}
						className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-[13px] text-muted-foreground"
					>
						<BallotBoxIcon className="text-primary" />
						{t('poll.sealed', { date: formatPollDate(poll.endTime, currentLanguage) })}
					</motion.p>
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
