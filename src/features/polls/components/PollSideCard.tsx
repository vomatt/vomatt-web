'use client';

import Link from 'next/link';
import { useId } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { NewMark, UnreadDot } from '@/features/notifications/UnreadDot';
import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/lib/utils';

import { formatFromNow } from '../format';
import type { Poll } from '../schema';
import { getTurnout } from '../status';

type PollSideCardProps = {
	/** Translation key of the card's heading. */
	headingKey: string;
	polls: Poll[];
	/** Says when each Poll ends, for Open ones. */
	showEndsIn?: boolean;
};

/** A titled side card of linked Polls, each with its turnout and an unread dot when it has one. */
export function PollSideCard({ headingKey, polls, showEndsIn = false }: PollSideCardProps) {
	const { t, currentLanguage } = useLanguage();
	// The distance depends on the browser's clock, so it waits for hydration
	const isHydrated = useHydrated();
	const headingId = useId();

	return (
		<section aria-labelledby={headingId} className="rounded-2xl border border-border bg-card p-5">
			<h2
				id={headingId}
				className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
			>
				{t(headingKey)}
			</h2>
			<ul className="mt-2 -mx-2">
				{polls.map((poll) => {
					const turnout = t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString() });
					const endsIn =
						showEndsIn && isHydrated && poll.endTime
							? t('poll.chipEndsIn', { distance: formatFromNow(poll.endTime, currentLanguage) })
							: null;
					return (
						<li key={poll.id}>
							<Link
								href={`/poll/${poll.id}`}
								className="flex min-h-11 gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-soft outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
							>
								<span className="min-w-0 flex-1">
									{/* The dot trails the title, so titles share one left edge whether read or not */}
									<span className="flex min-w-0 items-start gap-2">
										<span
											className={cn(
												'item-title min-w-0 line-clamp-2 leading-snug text-foreground',
												poll.unread && 'font-semibold'
											)}
										>
											{poll.title}
										</span>
										{poll.unread && <UnreadDot label={t('notifications.unread')} className="mt-1.5 shrink-0" />}
									</span>
									<span className="mt-0.5 block font-mono text-[12px] tabular-nums text-muted-foreground">
										{endsIn ? `${endsIn} · ${turnout}` : turnout}
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
