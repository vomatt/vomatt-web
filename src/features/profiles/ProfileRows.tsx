'use client';

import Link from 'next/link';

import { useLanguage } from '@/contexts/LanguageContext';
import { ballotChoice, ballotOutcome } from '@/features/account/insights';
import { NewMark, UnreadDot } from '@/features/notifications/UnreadDot';
import { isDecided, OutcomeChip } from '@/features/polls/components/OutcomeChip';
import { OwnerActions } from '@/features/polls/components/OwnerActions';
import { SealMark } from '@/features/polls/components/Seal';
import { StatusChip } from '@/features/polls/components/StatusChip';
import { formatPollDate } from '@/features/polls/format';
import { useViewerClock } from '@/features/polls/hooks/useViewerClock';
import type { Poll } from '@/features/polls/schema';
import { derivePollStatus, getTurnout, isCancelled, type PollStatus } from '@/features/polls/status';
import { pollTiming } from '@/features/polls/timing';
import { useHydrated } from '@/hooks/useHydrated';
import { toPayloadLocale } from '@/lib/locale';
import { rich, richList } from '@/lib/rich';
import { cn } from '@/lib/utils';

import { endedSummary } from './lists';

/** The row frame every profile list shares; hover lifts its line one step. */
export const profileRowClassName =
	'flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-border-strong';

const linkFocus =
	'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring';

/** A small heading over a run of rows: "Open now · 2". */
export function ProfileSection({
	icon,
	label,
	count,
	note,
}: {
	icon?: React.ReactNode;
	label: string;
	/** Left out while more pages remain, when the number would be wrong. */
	count?: number;
	note?: string;
}) {
	const { currentLanguage } = useLanguage();
	return (
		<h3 className="mx-0.5 mt-2.5 mb-0.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
			{icon}
			{label}
			{count !== undefined && (
				<>
					{' · '}
					<span className="font-mono tabular-nums">{count.toLocaleString(toPayloadLocale(currentLanguage))}</span>
				</>
			)}
			{note && ` · ${note}`}
		</h3>
	);
}

function useVotedText() {
	const { t, currentLanguage } = useLanguage();
	return (poll: Poll) => {
		const turnout = (getTurnout(poll) ?? 0).toLocaleString(toPayloadLocale(currentLanguage));
		return t('poll.voted', { count: turnout });
	};
}

/** What an Ended Poll decided, "**Yes** won" or "Tie between **A** and **B**"; nothing when there is no winner to name. */
export function DecidedText({ poll }: { poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const summary = endedSummary(poll);
	const strong = (text: string) => <strong className="font-medium text-foreground">{text}</strong>;
	if (summary.kind === 'won') return rich(t('profile.wonBy'), { option: strong(summary.winner) });
	if (summary.kind === 'tie') {
		return rich(t('profile.tieBetween'), { options: richList(summary.winners, toPayloadLocale(currentLanguage), strong) });
	}
	return null;
}

/** "**Yes** won · 2,061 voted", "Tie between **A** and **B** · 88 voted", or the turnout alone. */
function EndedMeta({ poll }: { poll: Poll }) {
	const { t } = useLanguage();
	const voted = useVotedText();
	if (isCancelled(poll)) return <>{t('notifications.cancelled')}</>;
	return (
		<>
			{endedSummary(poll).kind !== 'none' && (
				<>
					<DecidedText poll={poll} /> ·{' '}
				</>
			)}
			<span className="font-mono tabular-nums">{voted(poll)}</span>
		</>
	);
}

/** "1,284 voted · ends Fri 20:00", or a Scheduled poll's "Opens Mon 9:00"; the chip beside it says the status word. */
function OpenMeta({ poll, status }: { poll: Poll; status: PollStatus }) {
	const voted = useVotedText();
	const clock = useViewerClock();
	const when = clock && pollTiming(poll, status, clock).when;
	// The time waits for the browser's clock; a space holds the line's height until then
	if (status === 'scheduled') return <>{when ?? '\u00a0'}</>;
	return (
		<>
			<span className="font-mono tabular-nums text-foreground">{voted(poll)}</span>
			{when && ` · ${when}`}
		</>
	);
}

/**
 * The row's title with the unread dot right after it. The dot trails the name
 * of what's unread, as it trails a tab's label, so titles keep one left edge and
 * the chips one column whether a row is read or not.
 */
function RowTitle({ unread, children }: { unread?: boolean | null; children: React.ReactNode }) {
	const { t } = useLanguage();
	return (
		<span className="flex min-w-0 items-center gap-2">
			<span className={cn('item-title min-w-0 truncate leading-snug', unread && 'font-semibold')}>{children}</span>
			{unread && <UnreadDot label={t('notifications.unread')} className="shrink-0" />}
		</span>
	);
}

/**
 * A poll in an Asked list. Visitors get a link row; the owner gets the same row
 * with a ••• menu of their controls, and an unread dot after the title of results they haven't opened.
 */
export function AskedRow({
	poll,
	isOwn = false,
	onChanged,
}: {
	poll: Poll;
	isOwn?: boolean;
	/** After an edit, End now or Delete from the ••• menu. */
	onChanged?: () => void;
}) {
	const status = derivePollStatus(poll);
	const ended = status === 'ended';
	const unread = isOwn && ended && poll.unread;

	const text = (
		<span className="flex min-w-0 flex-1 flex-col gap-0.5">
			<RowTitle unread={unread}>{poll.title}</RowTitle>
			<span className="text-[12px] text-muted-foreground">
				{ended ? <EndedMeta poll={poll} /> : <OpenMeta poll={poll} status={status} />}
				{unread && (
					<>
						{' · '}
						<NewMark />
					</>
				)}
			</span>
		</span>
	);

	if (!isOwn) {
		return (
			<li>
				<Link href={`/poll/${poll.id}`} className={cn(profileRowClassName, linkFocus)}>
					{text}
					<StatusChip status={status} poll={poll} time="elsewhere" />
				</Link>
			</li>
		);
	}

	return (
		<li className={profileRowClassName}>
			<Link href={`/poll/${poll.id}`} className={cn('flex min-w-0 flex-1 rounded-md', linkFocus)}>
				{text}
			</Link>
			<StatusChip status={status} poll={poll} time="elsewhere" />
			<OwnerActions
				variant="menu"
				poll={poll}
				status={status}
				onChanged={() => onChanged?.()}
				onInviteeCount={() => {}}
				onDeleted={() => onChanged?.()}
			/>
		</li>
	);
}

/**
 * A poll the owner voted in. While open the ballot is Sealed: a Tide row with
 * their pick and when results open. Once decided: their pick, how it fared, and
 * an unread dot until they open the results.
 */
export function VotedRow({ poll }: { poll: Poll }) {
	const { t, currentLanguage } = useLanguage();
	const voted = useVotedText();
	const isHydrated = useHydrated();
	const status = derivePollStatus(poll);
	const choice = <strong className="font-medium">{ballotChoice(poll)}</strong>;

	if (status !== 'ended') {
		return (
			<li>
				<Link
					href={`/poll/${poll.id}`}
					className={cn(profileRowClassName, linkFocus, 'border-tide-line bg-tide-tint hover:border-tide')}
				>
					<SealMark />
					<span className="flex min-w-0 flex-1 flex-col gap-0.5">
						<span className="item-title truncate leading-snug">{poll.title}</span>
						<span className="text-[12px] text-tide-foreground">
							{t('myPolls.youChose')} {choice}
							{isHydrated &&
								poll.endTime &&
								` · ${t('profile.resultsAt', { date: formatPollDate(poll.endTime, currentLanguage) })}`}
						</span>
					</span>
					<span className="hidden font-mono text-[12px] tabular-nums text-tide-foreground sm:inline">{voted(poll)}</span>
				</Link>
			</li>
		);
	}

	const outcome = isCancelled(poll) ? null : ballotOutcome(poll, poll.myOptionId!);
	return (
		<li>
			<Link href={`/poll/${poll.id}`} className={cn(profileRowClassName, linkFocus)}>
				<span className="flex min-w-0 flex-1 flex-col gap-0.5">
					<RowTitle unread={poll.unread}>{poll.title}</RowTitle>
					<span className="text-[12px] text-muted-foreground">
						{t('myPolls.youChose')} <strong className="font-medium text-foreground">{ballotChoice(poll)}</strong>
						{' · '}
						{isCancelled(poll) ? t('notifications.cancelled') : <span className="font-mono tabular-nums">{voted(poll)}</span>}
						{poll.unread && (
							<>
								{' · '}
								<NewMark />
							</>
						)}
					</span>
				</span>
				{outcome && isDecided(outcome) && <OutcomeChip outcome={outcome} />}
			</Link>
		</li>
	);
}
