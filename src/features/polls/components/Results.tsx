'use client';

import { animate, m, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { countText } from '@/lib/count';
import { cn } from '@/lib/utils';

import { type ActionResult, isSealed } from '../errors';
import type { Poll, PollResults } from '../schema';
import { getResults } from '../service';
import { getWinners } from '../status';
import { YourVotePill } from './BallotMotion';

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

/** The red ballot stamp (a ring with a 卜 mark) on the winning option, pressed down once its bar fills. */
function ElectedStamp({ label }: { label: string }) {
	return (
		<m.svg
			viewBox="0 0 130 130"
			role="img"
			aria-label={label}
			className="relative size-[18px] shrink-0 text-elected"
			initial={{ scale: 1.6, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: BAR_DURATION }}
		>
			<circle cx="65" cy="65" r="60.3" fill="none" stroke="currentColor" strokeWidth="9.3" />
			<path d="M65 2v126M63.5 63.5 19 108" fill="none" stroke="currentColor" strokeWidth="10" />
		</m.svg>
	);
}

const ROW_CLASS = 'relative flex min-h-14 w-full items-center gap-3 px-5 py-2.5 text-left';

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
	const { t, currentLanguage } = useLanguage();
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
			<div className="space-y-2.5" aria-busy>
				{poll.options.map((option) => (
					<Skeleton key={option.id} className="h-14 rounded-xl" />
				))}
			</div>
		);
	}

	const participants =
		turnout ?? results?.totalParticipants ?? rows.reduce((sum, row) => sum + row.votes, 0);
	const winners = getWinners(rows);
	const support = (votes: number) =>
		participants === 0 ? 0 : Math.round((votes / participants) * 100);

	const myRow = rows.find((row) => row.id === myOptionId);
	let caption: string;
	if (myRow) {
		// The stamp says who won; the voter hears back what they chose
		caption = t('poll.yourVoteCaption', { option: myRow.text });
	} else if (winners.length === 0) {
		caption = t('poll.noVotes');
	} else if (winners.length > 1) {
		caption = t('poll.tie', {
			options: winners.map((row) => row.text).join(t('poll.and')),
		});
	} else {
		caption = countText(t, 'poll.won', participants, currentLanguage, { option: winners[0].text });
	}

	return (
		<div className="space-y-2.5">
			<ul className="space-y-2.5">
				{rows.map((row, index) => {
					const percent = support(row.votes);
					const isWinner = winners.includes(row);
					const delay = index * STAGGER;
					return (
						<li
							key={row.id}
							className={cn(
								'relative overflow-hidden rounded-xl text-[16px]',
								row === myRow ? 'border-[1.5px] border-foreground' : 'border border-border'
							)}
						>
							{/* One neutral for every bar: the winner is marked by its stamp, not its fill */}
							<m.div
								aria-hidden
								className="absolute inset-0 origin-left bg-muted"
								initial={{ scaleX: 0 }}
								animate={{ scaleX: percent / 100 }}
								transition={{ duration: BAR_DURATION, delay, ease: BAR_EASE }}
							/>
							<RowContent
								onClick={onSelectOption && row.votes > 0 ? () => onSelectOption(row) : undefined}
							>
								{isWinner && <ElectedStamp label={t('poll.elected')} />}
								<span className={cn('min-w-0 flex-1 wrap-anywhere', isWinner && 'font-medium')}>
									{row.text}
								</span>
								{row === myRow && <YourVotePill label={t('poll.yourVoteShort')} />}
								<span
									className={cn(
										'shrink-0 text-[14px] tabular-nums',
										!isWinner && 'text-muted-foreground'
									)}
								>
									<span className="sr-only">{percent}%</span>
									<CountUp value={percent} delay={delay} />
								</span>
							</RowContent>
						</li>
					);
				})}
			</ul>
			<p className="text-[14px] leading-5 text-muted-foreground">
				{caption}
				{onSelectOption && winners.length > 0 && <span className="block">{t('poll.votersHint')}</span>}
			</p>
		</div>
	);
}
