'use client';

import Link from 'next/link';
import { useId } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';

import { useViewerClock } from '../hooks/useViewerClock';
import type { Poll } from '../schema';
import { derivePollStatus, getTurnout } from '../status';
import { pollTiming } from '../timing';

/** The poll page's rail card of the author's other Polls: "ended · 611 voted", "ends Fri 20:00 · 96 voted". */
export function MoreFromAuthor({ username, polls }: { username: string; polls: Poll[] }) {
	const { t } = useLanguage();
	const clock = useViewerClock();
	const headingId = useId();

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
			<h2 id={headingId} className="text-caption-1 font-semibold uppercase tracking-label text-muted-foreground">
				{t('pollDetail.moreFrom', { username })}
			</h2>
			<ul className="-mx-2 -my-1.5">
				{polls.map((poll) => {
					const turnout = t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() });
					// The status and time wait for the browser's clock; the turnout alone until then
					const status = clock ? derivePollStatus(poll, clock.now) : null;
					const when =
						status === 'ended' ? t('pollDetail.ended') : status && clock ? pollTiming(poll, status, clock).when : null;
					return (
						<li key={poll.id}>
							<Link
								href={`/poll/${poll.id}`}
								className="flex min-h-11 flex-col gap-0.5 rounded-xl px-2 py-1.5 transition-colors outline-none hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
							>
								<span className="line-clamp-2 text-body-3 leading-snug font-medium tracking-title text-foreground">
									{poll.title}
								</span>
								<span className="text-caption-1 text-muted-foreground tabular-nums">
									{when ? `${when} · ${turnout}` : turnout}
								</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
