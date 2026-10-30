'use client';

import Link from 'next/link';

import { useLanguage } from '@/contexts/LanguageContext';
import { toPayloadLocale } from '@/lib/locale';
import { richList } from '@/lib/rich';
import { cn } from '@/lib/utils';

import type { Poll } from '../schema';
import { derivePollStatus } from '../status';
import { VotedPill } from './BallotMotion';
import { EndedMeta, Turnout } from './PollMeta';
import { StatusChip } from './StatusChip';

/** The tile's frame, shared with its skeleton so the two stay the same size. */
export const pollTileFrameClassName = 'flex flex-col gap-3 rounded-2xl border border-border bg-card p-5';

/** How many of a Poll's options a tile names before "+N more". */
const PREVIEW_OPTIONS = 3;

/**
 * Polls laid out to scan: 1 column, 2 from a 512px column, 3 from 896px (Explore's wide column
 * at xl). The columns follow the grid's own width, so the sidebar opening never miscounts them.
 */
export function PollTileGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="@container">
			<ul className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">{children}</ul>
		</div>
	);
}

/**
 * A Poll to scan: its status, the question, its first options (or what it decided) and its
 * turnout. The whole tile links to the poll page, where voting happens; a tile never holds a
 * Ballot, and no option counts show while the Poll is open.
 */
export function PollTile({ poll }: { poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const status = derivePollStatus(poll);
	const ended = status === 'ended';
	const hidden = poll.options.length - PREVIEW_OPTIONS;
	const topics = poll.tags?.slice(0, 2).map((tag) => tag.name) ?? [];

	return (
		<li className={cn(pollTileFrameClassName, 'relative transition-colors hover:border-border-strong')}>
			<div className="flex flex-wrap items-center gap-2">
				<StatusChip status={status} poll={poll} time="inline" onCard />
				{!ended && poll.myOptionId && <VotedPill label={t('poll.votedPill')} />}
			</div>

			<h2 className="poll-title line-clamp-3 wrap-anywhere text-foreground">
				{/* Stretched over the tile: one tab stop, its focus ring around the whole tile */}
				<Link
					href={`/poll/${poll.id}`}
					className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-solid focus-visible:after:outline-ring"
				>
					{poll.title}
				</Link>
			</h2>

			{!ended && poll.options.length > 0 && (
				<ul className="space-y-1 text-[14px] text-muted-foreground">
					{poll.options.slice(0, PREVIEW_OPTIONS).map((option) => (
						<li key={option.id} className="flex min-w-0 items-center gap-2">
							<span aria-hidden className="size-2 shrink-0 rounded-full border border-input" />
							<span className="truncate">{option.text}</span>
						</li>
					))}
					{hidden > 0 && <li className="pl-4">{t('explore.moreOptions', { count: String(hidden) })}</li>}
				</ul>
			)}

			{/* Pinned to the bottom, so the meta lines up across a row */}
			<p className="mt-auto text-[13px] text-muted-foreground">
				{/* A Scheduled Poll takes no Ballots yet, so it shows no turnout */}
				{ended ? <EndedMeta poll={poll} /> : status !== 'scheduled' && <Turnout poll={poll} />}
				{status !== 'scheduled' && topics.length > 0 && ' · '}
				{topics.length > 0 && richList(topics, toPayloadLocale(currentLanguage), (name) => name)}
			</p>
		</li>
	);
}
