'use client';

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { type ActionResult, isSealed } from '../errors';
import type { Poll, PollResults } from '../schema';
import { getResults } from '../service';

type Row = { id: string; text: string; votes: number };

const BAR_EASE = [0.22, 1, 0.36, 1] as const;
const BAR_DURATION = 0.8;
const STAGGER = 0.08;

/** Counts up to `value` alongside its bar. Screen readers get the final value elsewhere. */
function CountUp({ value, delay }: { value: number; delay: number }) {
	const reduceMotion = useReducedMotion();
	const count = useMotionValue(reduceMotion ? value : 0);
	const label = useTransform(count, (latest) => `${Math.round(latest)}%`);

	useEffect(() => {
		if (reduceMotion) {
			count.set(value);
			return;
		}
		const controls = animate(count, value, { duration: BAR_DURATION, delay, ease: BAR_EASE });
		return () => controls.stop();
	}, [count, delay, reduceMotion, value]);

	return <motion.span aria-hidden>{label}</motion.span>;
}

function Crown() {
	return (
		<motion.svg
			viewBox="0 0 16 16"
			aria-hidden
			className="mr-1.5 inline size-3.5 -translate-y-px text-emerald-600 dark:text-emerald-400"
			initial={{ scale: 0, rotate: -30 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{ type: 'spring', stiffness: 500, damping: 14, delay: BAR_DURATION }}
		>
			<path fill="currentColor" d="M2 5.5 5 8l3-5 3 5 3-2.5-1.2 7H3.2z" />
		</motion.svg>
	);
}

type ResultsProps = {
	poll: Poll;
	myOptionId: string | null;
	turnout: number | undefined;
	/** `/results` answered 403: the Poll is still sealed, so refetch it. */
	onSealed: () => void;
};

function rowsFromPoll(poll: Poll): Row[] | null {
	if (poll.options.some((option) => option.votes === undefined)) return null;
	return poll.options.map(({ id, text, votes }) => ({ id, text, votes: votes ?? 0 }));
}

/** Card state D. Only rendered for Ended Polls, so it never asks for sealed data. */
export function Results({ poll, myOptionId, turnout, onSealed }: ResultsProps) {
	const { t } = useLanguage();
	const [fetched, setFetched] = useState<ActionResult<PollResults> | null>(null);
	const inlineRows = rowsFromPoll(poll);
	const needsFetch = inlineRows === null;

	useEffect(() => {
		if (!needsFetch) return;
		let ignore = false;
		getResults(poll.id).then((result) => {
			if (ignore) return;
			// Still sealed after the refetch means the card's status is wrong; stop loading
			if (isSealed(result)) onSealed();
			setFetched(result);
		});
		return () => {
			ignore = true;
		};
	}, [poll.id, needsFetch, onSealed]);

	const results = fetched?.ok ? fetched.data : null;
	const rows =
		inlineRows ??
		results?.options.map(({ id, text, voteCount }) => ({ id, text, votes: voteCount }));
	const failed = fetched?.ok === false;

	if (!rows) {
		return failed ? (
			<p className="text-sm text-muted-foreground">{t('poll.resultsFailed')}</p>
		) : (
			<div className="space-y-1.5" aria-busy>
				{poll.options.map((option) => (
					<Skeleton key={option.id} className="h-10 rounded-lg" />
				))}
			</div>
		);
	}

	const participants =
		turnout ?? results?.totalParticipants ?? rows.reduce((sum, row) => sum + row.votes, 0);
	const topVotes = Math.max(0, ...rows.map((row) => row.votes));
	const winners = topVotes > 0 ? rows.filter((row) => row.votes === topVotes) : [];
	const support = (votes: number) =>
		participants === 0 ? 0 : Math.round((votes / participants) * 100);

	let caption: string;
	if (winners.length === 0) {
		caption = t('poll.noVotes');
	} else if (winners.length > 1) {
		caption = t('poll.tie', {
			options: winners.map((row) => row.text).join(t('poll.and')),
		});
	} else {
		caption = t('poll.won', { option: winners[0].text, count: participants });
	}

	return (
		<div className="space-y-3.5">
			<ul className="space-y-1.5">
				{rows.map((row, index) => {
					const percent = support(row.votes);
					const isWinner = winners.includes(row);
					const delay = index * STAGGER;
					return (
						<li
							key={row.id}
							className={cn(
								'relative overflow-hidden rounded-lg border text-sm',
								isWinner ? 'border-emerald-600/60' : 'border-border'
							)}
						>
							<motion.div
								aria-hidden
								className={cn(
									'absolute inset-0 origin-left',
									isWinner ? 'bg-emerald-600/15' : 'bg-foreground/[0.07]'
								)}
								initial={{ scaleX: 0 }}
								animate={{ scaleX: percent / 100 }}
								transition={{ duration: BAR_DURATION, delay, ease: BAR_EASE }}
							/>
							<div className="relative flex items-center justify-between gap-2.5 px-3.5 py-2.5">
								<span className={cn(isWinner && 'font-semibold')}>
									{isWinner && <Crown />}
									{row.text}
									{row.id === myOptionId && (
										<span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
											{t('poll.yourVoteShort')}
										</span>
									)}
								</span>
								<span className="shrink-0 font-mono text-[13px] tabular-nums">
									<span className="sr-only">{percent}%</span>
									<CountUp value={percent} delay={delay} />
									<span className="ml-1.5 text-xs text-muted-foreground">{row.votes}</span>
								</span>
							</div>
						</li>
					);
				})}
			</ul>
			<p className="text-xs text-muted-foreground">{caption}</p>
		</div>
	);
}
