'use client';

import { animate, m, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { type ActionResult, isSealed } from '../errors';
import type { Poll, PollResults } from '../schema';
import { getResults } from '../service';
import { getWinners } from '../status';

export type ResultRow = { id: string; text: string; votes: number };

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

	return <m.span aria-hidden>{label}</m.span>;
}

function Crown() {
	return (
		<m.svg
			viewBox="0 0 16 16"
			aria-hidden
			className="mr-1.5 inline size-3.5 -translate-y-px text-foreground"
			initial={{ scale: 0, rotate: -30 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: BAR_DURATION }}
		>
			<path fill="currentColor" d="M2 5.5 5 8l3-5 3 5 3-2.5-1.2 7H3.2z" />
		</m.svg>
	);
}

const ROW_CLASS = 'relative flex min-h-12 w-full items-center justify-between gap-2.5 px-4 py-3 text-left';

/** A plain row, or a button that opens who chose it. */
function RowContent({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
	if (!onClick) return <div className={ROW_CLASS}>{children}</div>;
	return (
		<button
			type="button"
			onClick={onClick}
			aria-haspopup="dialog"
			className={cn(ROW_CLASS, 'cursor-pointer rounded-xl outline-none transition-colors hover:bg-foreground/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring')}
		>
			{children}
		</button>
	);
}

type ResultsProps = {
	poll: Poll;
	myOptionId: string | null;
	turnout: number | undefined;
	/** `/results` answered 403: the Poll is still sealed, so refetch it. */
	onSealed: () => void;
	/** Set when the viewer may see who voted: options with votes become buttons. */
	onSelectOption?: (row: ResultRow) => void;
};

function rowsFromPoll(poll: Poll): ResultRow[] | null {
	if (poll.options.some((option) => option.votes === undefined)) return null;
	return poll.options.map(({ id, text, votes }) => ({ id, text, votes: votes ?? 0 }));
}

/** Card state D. Only rendered for Ended Polls, so it never asks for sealed data. */
export function Results({ poll, myOptionId, turnout, onSealed, onSelectOption }: ResultsProps) {
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
					<Skeleton key={option.id} className="h-12 rounded-xl" />
				))}
			</div>
		);
	}

	const participants =
		turnout ?? results?.totalParticipants ?? rows.reduce((sum, row) => sum + row.votes, 0);
	const winners = getWinners(rows);
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
			<ul className="space-y-2">
				{rows.map((row, index) => {
					const percent = support(row.votes);
					const isWinner = winners.includes(row);
					const delay = index * STAGGER;
					return (
						<li
							key={row.id}
							className={cn(
								'relative overflow-hidden rounded-xl border text-[15px]',
								isWinner ? 'border-foreground' : 'border-border'
							)}
						>
							<m.div
								aria-hidden
								className={cn(
									'absolute inset-0 origin-left',
									isWinner ? 'bg-foreground/[0.09]' : 'bg-foreground/[0.04]'
								)}
								initial={{ scaleX: 0 }}
								animate={{ scaleX: percent / 100 }}
								transition={{ duration: BAR_DURATION, delay, ease: BAR_EASE }}
							/>
							<RowContent
								onClick={onSelectOption && row.votes > 0 ? () => onSelectOption(row) : undefined}
							>
								<span className={cn('min-w-0 wrap-anywhere', isWinner && 'font-semibold')}>
									{isWinner && <Crown />}
									{row.text}
									{row.id === myOptionId && (
										<span className="ml-2 rounded-full border border-foreground/20 bg-volt px-2 py-px align-[1px] text-[11px] font-semibold text-foreground">
											{t('poll.yourVoteShort')}
										</span>
									)}
								</span>
								<span className="shrink-0 font-mono text-[13px] tabular-nums">
									<span className="sr-only">{percent}%</span>
									<CountUp value={percent} delay={delay} />
									<span className="ml-1.5 text-xs text-muted-foreground">{row.votes}</span>
								</span>
							</RowContent>
						</li>
					);
				})}
			</ul>
			<p className="text-[13px] text-muted-foreground">
				{caption}
				{onSelectOption && winners.length > 0 && <> · {t('poll.votersHint')}</>}
			</p>
		</div>
	);
}
