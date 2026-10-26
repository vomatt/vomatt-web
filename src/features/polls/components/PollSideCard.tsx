'use client';

import Link from 'next/link';
import { useId } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { NewMark, UnreadDot } from '@/features/notifications/UnreadDot';
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
	/** resultsIn: Ended Polls the viewer voted in, with unread dots. closingSoon: Open Polls and when each ends. */
	kind: SideCardKind;
	polls: Poll[];
};

/** A titled side card of linked Polls, each with its turnout and an unread dot when it has one. */
export function PollSideCard({ kind, polls }: PollSideCardProps) {
	const { t } = useLanguage();
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
					const turnout = t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() });
					// The time waits for the browser's clock; the turnout alone until then
					const when =
						kind === 'closingSoon' && clock ? pollTiming(poll, derivePollStatus(poll, clock.now), clock).when : null;
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
									<span className="mt-0.5 block font-mono text-[13px] tabular-nums text-muted-foreground">
										{when ? `${when} · ${turnout}` : turnout}
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
