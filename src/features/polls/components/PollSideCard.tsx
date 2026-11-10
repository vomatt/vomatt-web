'use client';

import Link from 'next/link';
import { Fragment, useId } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { NewMark, UnreadDot } from '@/features/notifications/UnreadDot';
import { toPayloadLocale } from '@/lib/locale';
import { META_GAP } from '@/lib/rich';
import { pollHref } from '@/lib/routes';
import { cn } from '@/lib/utils';

import { FEEDS, type RailFeedKind } from '../feeds';
import { useViewerClock } from '../hooks/useViewerClock';
import type { Poll } from '../schema';
import { derivePollStatus, getTurnout } from '../status';
import { pollTiming } from '../timing';
import { DecidedText, decidedWinners } from './PollMeta';

export type SideCardKind = RailFeedKind;

const TITLE_WEIGHT: Record<SideCardKind, (poll: Poll) => string> = {
	// Read titles drop to 400 so the unread ones (600, the dot, "new") stand out
	resultsIn: (poll) => (poll.unread ? 'font-semibold' : 'font-normal'),
	closingSoon: () => 'font-medium',
};

type PollSideCardProps = {
	/** resultsIn: Ended Polls the viewer voted in, what each decided and unread dots. closingSoon: Open Polls and when each ends. */
	kind: SideCardKind;
	polls: Poll[];
};

/** A side card of linked Polls, each with its turnout and an unread dot when it has one. Its title opens the whole feed. */
export function PollSideCard({ kind, polls }: PollSideCardProps) {
	const { t } = useLanguage();
	const headingId = useId();

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-[18px]">
			<h2
				id={headingId}
				className="text-caption-1 font-medium text-muted-foreground"
			>
				<Link
					href={FEEDS[kind].href}
					className="rounded-sm transition-colors outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
				>
					{t(FEEDS[kind].label)}
				</Link>
			</h2>
			<ul className="-mx-2 -my-1.5">
				{polls.map((poll) => (
					<li key={poll.id}>
						<Link
							href={pollHref(poll.id)}
							className="flex min-h-11 gap-3 rounded-xl px-2 py-1.5 transition-colors outline-none hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
						>
							<PollSideText kind={kind} poll={poll} />
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

/** A Poll's title, unread dot and meta line: when it ends or what it decided, then its turnout. */
function PollSideText({ kind, poll }: { kind: SideCardKind; poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const clock = useViewerClock();
	const turnout = t('poll.voted', { count: (getTurnout(poll) ?? 0).toLocaleString(toPayloadLocale(currentLanguage)) });
	// The time waits for the browser's clock; the turnout alone until then
	const when =
		kind === 'closingSoon' && clock ? pollTiming(poll, derivePollStatus(poll, clock.now), clock).when : null;
	// A short "Tie": the rail has no room to name every winner
	const winners = kind === 'resultsIn' ? decidedWinners(poll) : null;
	const decided = winners && <DecidedText {...winners} shortTie />;
	const meta = [when, decided, turnout].filter(Boolean);

	return (
		<span className="min-w-0 flex-1">
			{/* The dot trails the title, so titles share one left edge whether read or not */}
			<span className="flex min-w-0 items-start gap-2">
				<span
					className={cn(
						'min-w-0 line-clamp-2 text-body-3 leading-snug tracking-title text-foreground',
						TITLE_WEIGHT[kind](poll)
					)}
				>
					{poll.title}
				</span>
				{poll.unread && <UnreadDot label={t('notifications.unread')} className="mt-1.5 shrink-0" />}
			</span>
			<span
				className={cn(
					'mt-0.5 block text-caption-1 text-muted-foreground',
					kind === 'closingSoon' && 'tabular-nums'
				)}
			>
				{meta.map((part, i) => (
					<Fragment key={i}>
						{i > 0 && META_GAP}
						{part}
					</Fragment>
				))}
				{poll.unread && (
					<>
						{META_GAP}
						<NewMark className="font-sans" />
					</>
				)}
			</span>
		</span>
	);
}
