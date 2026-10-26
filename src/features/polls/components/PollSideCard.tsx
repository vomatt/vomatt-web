'use client';

import Link from 'next/link';
import { Fragment, useId } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { NewMark, UnreadDot } from '@/features/notifications/UnreadDot';
import { endedSummary } from '@/features/profiles/lists';
import { toPayloadLocale } from '@/lib/locale';
import { rich } from '@/lib/rich';
import { cn } from '@/lib/utils';

import { useViewerClock } from '../hooks/useViewerClock';
import type { Poll } from '../schema';
import { derivePollStatus, getTurnout } from '../status';
import { pollTiming } from '../timing';

type SideCardKind = 'resultsIn' | 'closingSoon';

const KINDS: Record<SideCardKind, { heading: string; titleWeight: (poll: Poll) => string }> = {
	// Read titles drop to 400 so the unread ones (600, the dot, "new") stand out
	resultsIn: { heading: 'homePage.resultsIn', titleWeight: (poll) => (poll.unread ? 'font-semibold' : 'font-normal') },
	closingSoon: { heading: 'homePage.closingSoon', titleWeight: () => 'font-medium' },
};

type PollSideCardProps = {
	/** resultsIn: Ended Polls the viewer voted in, what each decided and unread dots. closingSoon: Open Polls and when each ends. */
	kind: SideCardKind;
	polls: Poll[];
};

/** A titled side card of linked Polls, each with its turnout and an unread dot when it has one. */
export function PollSideCard({ kind, polls }: PollSideCardProps) {
	const { t, currentLanguage } = useLanguage();
	const clock = useViewerClock();
	const headingId = useId();
	const { heading, titleWeight } = KINDS[kind];

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-[18px]">
			<h2
				id={headingId}
				className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
			>
				{t(heading)}
			</h2>
			<ul className="-mx-2 -my-1.5">
				{polls.map((poll) => {
					const turnout = t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString(toPayloadLocale(currentLanguage)) });
					// The time waits for the browser's clock; the turnout alone until then
					const when =
						kind === 'closingSoon' && clock ? pollTiming(poll, derivePollStatus(poll, clock.now), clock).when : null;
					// DecidedText's "**Yes** won", but a short "Tie": the rail has no room to name every winner
					const summary = kind === 'resultsIn' ? endedSummary(poll) : null;
					const decided =
						summary?.kind === 'won'
							? rich(t('profile.wonBy'), {
									option: <strong className="font-medium text-foreground">{summary.winner}</strong>,
								})
							: summary?.kind === 'tie'
								? t('homePage.resultsTie')
								: null;
					const meta = [when, decided, turnout].filter(Boolean);
					return (
						<li key={poll.id}>
							<Link
								href={`/poll/${poll.id}`}
								className="flex min-h-11 gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-soft outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
							>
								<span className="min-w-0 flex-1">
									{/* The dot trails the title, so titles share one left edge whether read or not */}
									<span className="flex min-w-0 items-start gap-2">
										<span
											className={cn(
												'min-w-0 line-clamp-2 text-[15px] leading-[1.35] tracking-[-0.01em] text-foreground',
												titleWeight(poll)
											)}
										>
											{poll.title}
										</span>
										{poll.unread && <UnreadDot label={t('notifications.unread')} className="mt-1.5 shrink-0" />}
									</span>
									<span
										className={cn(
											'mt-0.5 block text-[13px] text-muted-foreground',
											kind === 'closingSoon' && 'font-mono tabular-nums'
										)}
									>
										{meta.map((part, i) => (
											<Fragment key={i}>
												{i > 0 && ' · '}
												{part}
											</Fragment>
										))}
										{poll.unread && (
											<>
												{' · '}
												<NewMark className="font-sans" />
											</>
										)}
									</span>
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
