'use client';

import Link from 'next/link';
import { Fragment, useId } from 'react';

import { useLanguage } from '@/contexts/LanguageContext';
import { NewMark, UnreadDot } from '@/features/notifications/UnreadDot';
import { endedSummary } from '@/features/profiles/lists';
import { toPayloadLocale } from '@/lib/locale';
import { rich } from '@/lib/rich';
import { META_GAP } from '@/lib/rich';
import { pollHref } from '@/lib/routes';
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
	const { t } = useLanguage();
	const headingId = useId();

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-[18px]">
			<h2
				id={headingId}
				className="text-caption-1 font-medium text-muted-foreground"
			>
				{t(KINDS[kind].heading)}
			</h2>
			<ul className="-mx-2 -my-1.5">
				{polls.map((poll) => (
					<li key={poll.id}>
						<Link
							href={pollHref(poll.id)}
							className={cn('flex min-h-11 gap-3 rounded-xl px-2 py-1.5', LINK_CLASS)}
						>
							<PollSideText kind={kind} poll={poll} />
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

/**
 * The side cards as one row of tiles under the topics, for phones and tablets, where the rail
 * follows a feed that never ends. Each tile names its card. Renders nothing when both are empty.
 * On phones the row runs to the screen's edges; from md it stops at the feed column's.
 */
export function PollSideStrip({ resultsIn, closingSoon }: { resultsIn: Poll[]; closingSoon: Poll[] }) {
	const { t } = useLanguage();
	const tiles = [
		...resultsIn.map((poll) => ({ kind: 'resultsIn' as const, poll })),
		...closingSoon.map((poll) => ({ kind: 'closingSoon' as const, poll })),
	];
	if (tiles.length === 0) return null;

	return (
		<ul
			aria-label={t('homePage.sideStrip')}
			className="-mx-contain flex snap-x scroll-px-contain gap-3 overflow-x-auto px-contain pt-1 pb-2 scrollbar-none md:mx-0 md:scroll-px-0 md:px-0"
		>
			{tiles.map(({ kind, poll }) => (
				<li key={`${kind}:${poll.id}`} className="flex w-60 shrink-0 snap-start">
					<Link
						href={pollHref(poll.id)}
						className={cn('flex w-full flex-col gap-1 rounded-2xl border border-border bg-card px-3.5 py-3', LINK_CLASS)}
					>
						<span className="text-caption-2 font-medium text-muted-foreground">{t(KINDS[kind].heading)}</span>
						<PollSideText kind={kind} poll={poll} />
					</Link>
				</li>
			))}
		</ul>
	);
}

const LINK_CLASS =
	'transition-colors hover:bg-surface-soft outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

/** A Poll's title, unread dot and meta line: when it ends or what it decided, then its turnout. */
function PollSideText({ kind, poll }: { kind: SideCardKind; poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const clock = useViewerClock();
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
		<span className="min-w-0 flex-1">
			{/* The dot trails the title, so titles share one left edge whether read or not */}
			<span className="flex min-w-0 items-start gap-2">
				<span
					className={cn(
						'min-w-0 line-clamp-2 text-body-3 leading-snug tracking-title text-foreground',
						KINDS[kind].titleWeight(poll)
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
