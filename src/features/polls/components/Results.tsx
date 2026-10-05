'use client';

import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { isSealed } from '../errors';
import { fill } from '../format';
import type { Poll } from '../schema';
import { getResults } from '../service';

type Row = { id: string; text: string; votes: number };

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
	const [fetched, setFetched] = useState<{ rows: Row[]; participants?: number } | null>(null);
	const [failed, setFailed] = useState(false);
	const inlineRows = rowsFromPoll(poll);
	const needsFetch = inlineRows === null;

	useEffect(() => {
		if (!needsFetch) return;
		let ignore = false;
		getResults(poll.id).then((result) => {
			if (ignore) return;
			if (result.ok) {
				setFetched({
					rows: result.data.options.map(({ id, text, voteCount }) => ({
						id,
						text,
						votes: voteCount,
					})),
					participants: result.data.totalParticipants,
				});
			} else if (isSealed(result)) {
				onSealed();
			} else {
				setFailed(true);
			}
		});
		return () => {
			ignore = true;
		};
	}, [poll.id, needsFetch, onSealed]);

	const rows = inlineRows ?? fetched?.rows;

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
		turnout ?? fetched?.participants ?? rows.reduce((sum, row) => sum + row.votes, 0);
	const topVotes = Math.max(0, ...rows.map((row) => row.votes));
	const winners = topVotes > 0 ? rows.filter((row) => row.votes === topVotes) : [];
	const support = (votes: number) =>
		participants === 0 ? 0 : Math.round((votes / participants) * 100);

	let caption: string;
	if (winners.length === 0) {
		caption = t('poll.noVotes');
	} else if (winners.length > 1) {
		caption = fill(t('poll.tie'), {
			options: winners.map((row) => row.text).join(t('poll.and')),
		});
	} else {
		caption = fill(t('poll.won'), { option: winners[0].text, count: participants });
	}

	return (
		<div className="space-y-3.5">
			<ul className="space-y-1.5">
				{rows.map((row) => {
					const percent = support(row.votes);
					const isWinner = winners.includes(row);
					return (
						<li
							key={row.id}
							className={cn(
								'relative overflow-hidden rounded-lg border text-sm',
								isWinner ? 'border-emerald-600/60' : 'border-border'
							)}
						>
							<div
								aria-hidden
								className={cn(
									'absolute inset-0 origin-left transition-transform duration-500 ease-out motion-reduce:transition-none',
									isWinner ? 'bg-emerald-600/15' : 'bg-foreground/[0.07]'
								)}
								style={{ transform: `scaleX(${percent / 100})` }}
							/>
							<div className="relative flex items-center justify-between gap-2.5 px-3.5 py-2.5">
								<span className={cn(isWinner && 'font-semibold')}>
									{row.text}
									{row.id === myOptionId && (
										<span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
											{t('poll.yourVoteShort')}
										</span>
									)}
								</span>
								<span className="shrink-0 font-mono text-[13px] tabular-nums">
									{percent}%
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
